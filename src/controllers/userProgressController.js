const UserProgress = require('../models/userProgress');
const Lesson = require('../models/lesson');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');

exports.getUserProgress = async (req, res) => {
    try {
        let progress = await UserProgress.findOne({ userId: req.user._id })
            .populate('lessonProgresses.lessonId', 'title order');

        if (!progress) {
            // Inisialisasi progress baru
            const lessons = await Lesson.find({}).sort('order');
            
            const initialLessonProgresses = lessons.map(lesson => ({
                lessonId: lesson._id,
                status: lesson.order === 1 ? 'unlocked' : 'locked',
                quizScore: 0
            }));

            progress = await UserProgress.create({
                userId: req.user._id,
                lessonProgresses: initialLessonProgresses
            });

            await progress.populate('lessonProgresses.lessonId', 'title order');
        }

        // Hitung statistik untuk page profil
        const stats = {
            totalLessons: progress.lessonProgresses.length,
            completedLessons: progress.lessonProgresses.filter(l => l.status === 'completed').length,
            averageScore: progress.lessonProgresses.reduce((acc, curr) => acc + curr.quizScore, 0) / 
                    progress.lessonProgresses.length || 0
        };

        res.json({
            success: true,
            data: {
                progress,
                stats
            }
        });
    } catch (error) {
        console.error('Error in getUserProgress:', error);
        res.status(500).json({
            success: false,
            error: {
                code: ErrorCodes.DB_ERROR,
                message: 'Failed to fetch user progress'
            }
        });
    }
};

exports.getTheme = async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ userId: req.user._id });
        res.json({
            success: true,
            data: {
                theme: progress?.theme || 'light'
            }
        });
    } catch (error) {
        console.error('Error in getTheme:', error);
        res.status(500).json({
            success: false,
            error: {
                code: ErrorCodes.DB_ERROR,
                message: 'Failed to fetch theme'
            }
        });
    }
};

// Handler untuk update theme
exports.updateTheme = async (req, res) => {
    try {
        const { theme } = req.body;
        
        if (!theme || !['light', 'dark'].includes(theme)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: ErrorCodes.INVALID_INPUT,
                    message: 'Invalid theme'
                }
            });
        }

        const progress = await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { theme },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            data: { theme: progress.theme }
        });
    } catch (error) {
        console.error('Error in updateTheme:', error);
        res.status(500).json({
            success: false,
            error: {
                code: ErrorCodes.DB_ERROR,
                message: 'Failed to update theme'
            }
        });
    }
};

// Submit quiz dan update progress sekarang digabung
exports.submitQuizAndUpdateProgress = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { answers, score } = req.body;

        // Validasi lesson
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: {
                    code: ErrorCodes.RESOURCE_NOT_FOUND,
                    message: 'Lesson not found'
                }
            });
        }

        let progress = await UserProgress.findOne({ userId: req.user._id });
        if (!progress) {
            return res.status(404).json({
                success: false,
                error: {
                    code: ErrorCodes.RESOURCE_NOT_FOUND,
                    message: 'User progress not found'
                }
            });
        }

        // Update progress
        const lessonProgress = progress.lessonProgresses.find(
            lp => lp.lessonId.toString() === lessonId
        );

        if (!lessonProgress) {
            return res.status(404).json({
                success: false,
                error: {
                    code: ErrorCodes.RESOURCE_NOT_FOUND,
                    message: 'Lesson progress not found'
                }
            });
        }

        lessonProgress.quizScore = score;
        lessonProgress.lastAttemptAt = new Date();

        // Update lesson status jika score >= 60
        if (score >= 60) {
            lessonProgress.status = 'completed';
        }

        await progress.save();

        res.json({
            success: true,
            data: {
                progress,
                lessonCompleted: score >= 60
            }
        });
    } catch (error) {
        console.error('Error in submitQuizAndUpdateProgress:', error);
        res.status(500).json({
            success: false,
            error: {
                code: ErrorCodes.DB_ERROR,
                message: 'Failed to update progress'
            }
        });
    }
};

module.exports = exports;