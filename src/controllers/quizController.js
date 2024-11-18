const { Question, UserProgress } = require('../models');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');

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
        throw new AppError('Failed to fetch quiz questions', 500, ErrorCodes.DB_ERROR);
    }
};

exports.submitQuiz = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { answers } = req.body;

        // Validasi jawaban
        const questions = await Question.find({ lesson_id: lessonId });
        if (!questions.length) {
            throw new AppError('Quiz not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        // Hitung score
        let correctAnswers = 0;
        questions.forEach(question => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            if (userAnswer) {
                const correctOption = question.options.find(opt => opt.isCorrect);
                if (correctOption && userAnswer.selectedAnswer === correctOption._id.toString()) {
                    correctAnswers++;
                }
            }
        });

        const score = (correctAnswers / questions.length) * 100;

        // Update progress
        const progress = await UserProgress.findOne({ userId: req.user._id });
        if (!progress) {
            throw new AppError('User progress not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        const lessonProgress = progress.lessonProgresses.find(
            lp => lp.lessonId.toString() === lessonId
        );

        if (!lessonProgress) {
            throw new AppError('Lesson progress not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        // Update skor dan status
        lessonProgress.quizScore = score;
        lessonProgress.lastAttemptAt = new Date();
        if (score >= 60) {
            lessonProgress.status = 'completed';
        }

        await progress.save();

        res.json({
            success: true,
            data: {
                score,
                passed: score >= 60,
                progress: lessonProgress
            }
        });
    } catch (error) {
        throw error;
    }
};