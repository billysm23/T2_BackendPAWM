const { Lesson, UserProgress } = require('../models');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllLessons = async (req, res) => {
    try {
        console.log('Fetching all lessons...');
        const lessons = await Lesson.find().sort({ order: 1 });
        console.log('Lessons found:', lessons.length);
        
        res.json({
            success: true,
            data: lessons
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lessons'
        });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        console.log('Getting lesson with ID:', req.params.id);
        const lesson = await Lesson.findById(req.params.id)
            .populate('prerequisite', 'title order');
        console.log('Found lesson:', lesson);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson'
        });
    }
};

exports.getLessonOverview = async (req, res) => {
    const { id } = req.params;

    try {
    //     const cached = await client.get(`lesson:${id}:overview`);
    //     if (cached) {
    //         return res.json({
    //             success: true,
    //             data: JSON.parse(cached)
    //         });
    //     }

        const overview = await Lesson.findById(id)
            .select('learningObjectives prerequisites topics')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:overview`,
        //     3600,
        //     JSON.stringify(overview)
        // );

        res.json({
            success: true,
            data: overview
        });

    } catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson overview'
        });
    }
};

exports.getLessonContent = async (req, res) => {
    const { id } = req.params;

    try {
        // const cached = await client.get(`lesson:${id}:content`);
        // if (cached) {
        //     return res.json({
        //         success: true,
        //         data: JSON.parse(cached)
        //     });
        // }

        const content = await Lesson.findById(id)
            .select('content keyConcepts interactiveExamples practiceProblems')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:content`,
        //     3600,
        //     JSON.stringify(content)
        // );

        res.json({
            success: true,
            data: content
        });

    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson content'
        });
    }
};

exports.getLessonResources = async (req, res) => {
    const { id } = req.params;

    try {
        const resources = await Lesson.findById(id)
            .select('additionalReading videos documents externalLinks')
            .lean();

        res.json({
            success: true,
            data: resources
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson resources'
        });
    }
};

exports.getLessonQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quiz = await Lesson.findById(id)
        .select('quiz')
        .lean();

    if (!quiz) {
        throw new AppError(
            'Quiz not found',
            404,
            ErrorCodes.RESOURCE_NOT_FOUND
        );
    }

    // Remove correct answers for security
    const sanitizedQuiz = quiz.quiz.map(q => ({
        ...q,
        options: q.options.map(opt => ({
            _id: opt._id,
            text: opt.text
        }))
    }));

    res.json({
        success: true,
        data: sanitizedQuiz
    });
});

exports.saveQuizProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    let progress = await UserProgress.findOne({
        user_id: userId,
        'lessons.lesson_id': id
    });

    if (!progress) {
        progress = new UserProgress({
            user_id: userId,
            lessons: [{
                lesson_id: id,
                quiz_answers: answers,
                last_accessed: new Date()
            }]
        });
    } else {
        const lessonIndex = progress.lessons.findIndex(
            l => l.lesson_id.toString() === id
        );

        if (lessonIndex === -1) {
            progress.lessons.push({
                lesson_id: id,
                quiz_answers: answers,
                last_accessed: new Date()
            });
        } else {
            progress.lessons[lessonIndex].quiz_answers = answers;
            progress.lessons[lessonIndex].last_accessed = new Date();
        }
    }

    await progress.save();

    res.json({
        success: true,
        data: progress.lessons.find(l => l.lesson_id.toString() === id)
    });
});

exports.getQuizProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const progress = await UserProgress.findOne({
        user_id: userId,
        'lessons.lesson_id': id
    }, {
        'lessons.$': 1
    });

    res.json({
        success: true,
        data: progress?.lessons[0] || null
    });
});

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

module.exports = exports;