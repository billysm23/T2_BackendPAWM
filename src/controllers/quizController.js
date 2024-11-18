const Question = require('../models/question');
const UserProgress = require('../models/userProgress');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');

exports.getQuizByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        console.log('Fetching quiz for lesson:', lessonId);

        const lessonNumber = parseInt(lessonId);
        if (isNaN(lessonNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid lesson ID'
            });
        }

        const questions = await Question.find(
            { lesson: lessonNumber },
            null,
            { sort: { question_no: 1 } }
        );

        console.log(`Found ${questions.length} questions for lesson ${lessonNumber}`);

        if (!questions || questions.length === 0) {
            return res.json({
                success: true,
                data: {
                    questions: [],
                    message: `No questions found for lesson ${lessonNumber}`
                }
            });
        }

        // Format questions untuk client (tanpa isCorrect)
        const formattedQuestions = questions.map(q => ({
            _id: q._id,
            question_no: q.question_no,
            question_text: q.question_text,
            type: q.type,
            options: q.options.map(opt => ({
                text: opt.text
            }))
        }));

        res.json({
            success: true,
            data: {
                questions: formattedQuestions,
                totalQuestions: questions.length
            }
        });

    } catch (error) {
        console.error('Error in getQuizByLesson:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.submitQuiz = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { answers } = req.body;
        
        // Ambil semua pertanyaan untuk lesson ini
        const questions = await Question.find({ lesson: lessonNumber });
        
        // Hitung score
        let correctCount = 0;
        questions.forEach(question => {
            const userAnswer = answers.find(ans => 
                ans.questionId === question._id.toString()
            );
            
            if (userAnswer) {
                const correctOption = question.options.find(opt => opt.isCorrect);
                if (correctOption && userAnswer.selectedAnswer === correctOption._id.toString()) {
                    correctCount++;
                }
            }
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= 60;

        res.json({
            success: true,
            data: {
                score,
                passed,
                correctAnswers: correctCount,
                totalQuestions: questions.length
            }
        });

    } catch (error) {
        console.error('Error in submitQuiz:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};