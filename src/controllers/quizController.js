const { Question, UserQuiz, UserLesson } = require('../models');

exports.submitQuiz = async (req, res) => {
    try {
        const { lesson_id, answers } = req.body;
        // Validasi apakah user bisa mengakses lesson
        const userLesson = await UserLesson.findOne({
            user_id: req.user._id,
            lesson_id
        });
        if (!userLesson) {
            return res.status(404).json({ error: 'Lesson not found or not accessible' });
        }
        // Mencari atau membuat status quiz
        let userQuiz = await UserQuiz.findOneAndUpdate(
            { 
                user_id: req.user._id, 
                lesson_id,
                status: { $ne: 'completed' }
            },
            {
                $set: {
                    status: 'completed',
                    answers: answers.map(answer => ({
                        ...answer,
                        answered_at: new Date()
                    })),
                    completed_at: new Date()
                },
                $inc: { attempts: 1 }
            },
            { new: true, upsert: true }
        );
        // score
        const questions = await Question.find({ lesson_id });
        const score = calculateScore(answers, questions);
        userQuiz.score = score;
        await userQuiz.save();

        // Update status lesson dengan syarat
        if (score >= 70) {
            await UserLesson.findOneAndUpdate(
                { user_id: req.user._id, lesson_id },
                { 
                    status: 'completed',
                    completed_at: new Date()
                }
            );
        }
        res.json({ 
            success: true,
            data: {
                quiz_id: userQuiz._id,
                score,
                completed_at: userQuiz.completed_at,
                passed: score >= 70
            }
        });
    } catch (error) {
        console.error('Quiz submission error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit quiz'
        });
    }
};

exports.getQuizByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const questions = await Question.find({ 
            lesson_id: lessonId 
        }).select('-options.isCorrect');
        res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch quiz questions'
        });
    }
};

exports.getQuizProgress = async (req, res) => {
    try {
        const quizProgress = await UserQuiz.find({
            user_id: req.user._id,
            status: 'in_progress'
        }).populate('lesson_id', 'title');
        res.json({
            success: true,
            data: quizProgress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch quiz progress'
        });
    }
};

exports.getQuizHistory = async (req, res) => {
    try {
        const user_id = req.user._id;

        const quizHistory = await UserQuiz.find({
            user_id,
            status: 'completed'
        })
        .populate('lesson_id', 'title')
        .sort({ completed_at: -1 });

        res.json({
            success: true,
            data: quizHistory
        });
    } catch (error) {
        console.error('Error fetching quiz history:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching quiz history'
        });
    }
};

function calculateScore(userAnswers, questions) {
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
        const userAnswer = userAnswers.find(a => a.question_id.toString() === question._id.toString());
        if (!userAnswer) return;

        totalPoints += question.points;

        switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
                if (userAnswer.user_answer === question.options.find(opt => opt.isCorrect)._id.toString()) {
                    earnedPoints += question.points;
                }
                break;
            case 'multi_select':
                const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt._id.toString());
                const userOptions = userAnswer.user_answer;
                if (arraysEqual(correctOptions.sort(), userOptions.sort())) {
                    earnedPoints += question.points;
                }
                break;
            // sisanya belum
        }
    });

    return Math.round((earnedPoints / totalPoints) * 100);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
}

module.exports = exports;