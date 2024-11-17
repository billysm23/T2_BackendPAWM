const UserProgress = require('../models/userProgress');
const Lesson = require('../models/lesson');
const AppError = require('../utils/errors/AppError');
const ErrorCodes = require('../utils/errors/errorCodes');

exports.getUserProgress = async (req, res) => {
    try {
        // Cari progress user yang ada
        let progress = await UserProgress.findOne({ userId: req.user._id })
            .populate('lessons.lessonId', 'title order prerequisites');

        if (!progress) {
            // Ambil semua lessons untuk inisialisasi
            const lessons = await Lesson.find({}).sort('order');
            
            // Inisialisasi lessons dengan lesson pertama unlocked
            const initialLessons = lessons.map(lesson => ({
                lessonId: lesson._id,
                // Lesson pertama unlocked, sisanya locked
                status: lesson.order === 1 ? 'unlocked' : 'locked',
                score: 0,
                timeSpent: 0,
                completedContent: [],
                lastAccessedAt: new Date()
            }));

            // Buat progress baru
            progress = await UserProgress.create({
                userId: req.user._id,
                lessons: initialLessons
            });

            await progress.populate('lessons.lessonId', 'title order prerequisites');
        }

        // Hitung statistik progress
        const stats = {
            totalLessons: progress.lessons.length,
            completedLessons: progress.lessons.filter(l => l.status === 'completed').length,
            averageScore: progress.lessons.reduce((acc, curr) => acc + curr.score, 0) / progress.lessons.length,
            timeSpent: progress.lessons.reduce((acc, curr) => acc + curr.timeSpent, 0)
        };

        res.json({
            success: true,
            data: {
                progress,
                stats
            }
        });
    } catch (error) {
        throw new AppError('Failed to fetch user progress', 500, ErrorCodes.DB_ERROR);
    }
};

exports.getTheme = async (req, res) => {
    try {
        let progress = await UserProgress.findOne({username: req.user.username});
        // Jika user belum menentukan (tidak ada overall progress), get default theme (light)
        if (!progress) {
            return res.json({
                success: true,
                data: {
                    theme: 'light',
                }
            });
        }
        // Jika sudah, get theme yang sudah diset user
        res.json({
            success: true,
            data: {
                theme: progress.theme
            }
        });
    } catch (error) {
        console.error('Get theme error', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching theme preference'
        });
    }
};

// Update theme sesuai request user
exports.updateTheme = async (req, res) => {
    try {
        const { theme } = req.body;
        
        // Validasi theme
        if (!theme) {
            return res.status(400).json({
                success: false,
                error: 'Theme is required'
            });
        }

        if (!['light', 'dark'].includes(theme)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid theme value. Must be "light" or "dark"'
            });
        }

        // Mencari progress
        let progress = await UserProgress.findOne({ username: req.user.username });
        // Membuat yang baru jika belum ada
        if (!progress) {
            progress = new UserProgress({
                username: req.user.username,
                theme,
                lessons: []
            });
        } else {
            progress.theme = theme;
        }

        await progress.save();

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Update theme error:', error);
        res.status(500).json({
            success: false,
            error: `Error updating theme: ${error.message}`
        });
    }
};

// Get lesson progress
exports.getLessonProgress = async (req, res) => {
    try {
        const progress = await UserProgress.findOne(
            { username: req.user.username },
            { lessons: 1 }
        );

        res.json({
            success: true,
            data: progress ? progress.lessons : []
        });
    } catch (error) {
        console.error('Get lesson progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson progress'
        });
    }
};

exports.updateLessonProgress = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { status, timeSpent, completedContent } = req.body;

        console.log('Updating lesson progress:', { lessonId, status, userId: req.user._id });

        // Verifikasi lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            throw new AppError('Lesson not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        // Cari atau buat progress user
        let progress = await UserProgress.findOne({ userId: req.user._id });
        if (!progress) {
            // Inisialisasi progress baru
            progress = new UserProgress({
                userId: req.user._id,
                lessons: [{
                    lessonId: lessonId,
                    status: 'started',
                    timeSpent: timeSpent || 0,
                    completedContent: completedContent || [],
                    lastAccessedAt: new Date()
                }]
            });
        } else {
            // Update existing progress
            const lessonIndex = progress.lessons.findIndex(l => 
                l.lessonId.toString() === lessonId
            );

            if (lessonIndex === -1) {
                // Tambah lesson baru ke progress
                progress.lessons.push({
                    lessonId: lessonId,
                    status: status || 'started',
                    timeSpent: timeSpent || 0,
                    completedContent: completedContent || [],
                    lastAccessedAt: new Date()
                });
            } else {
                // Update lesson yang ada
                progress.lessons[lessonIndex] = {
                    ...progress.lessons[lessonIndex],
                    status: status || progress.lessons[lessonIndex].status,
                    timeSpent: (progress.lessons[lessonIndex].timeSpent || 0) + (timeSpent || 0),
                    completedContent: completedContent 
                        ? [...new Set([...progress.lessons[lessonIndex].completedContent, ...completedContent])]
                        : progress.lessons[lessonIndex].completedContent,
                    lastAccessedAt: new Date()
                };

                // Jika completed, unlock next lesson
                if (status === 'completed') {
                    const nextLesson = await Lesson.findOne({ order: lesson.order + 1 });
                    if (nextLesson) {
                        const nextLessonIndex = progress.lessons.findIndex(l => 
                            l.lessonId.toString() === nextLesson._id.toString()
                        );
                        
                        if (nextLessonIndex !== -1) {
                            progress.lessons[nextLessonIndex].status = 'unlocked';
                        } else {
                            progress.lessons.push({
                                lessonId: nextLesson._id,
                                status: 'unlocked',
                                lastAccessedAt: new Date()
                            });
                        }
                    }
                }
            }
        }

        await progress.save();
        console.log('Progress updated successfully');

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.errorCode,
                    message: error.message
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: {
                    code: ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: 'Failed to update progress'
                }
            });
        }
    }
};

// Submit quiz
exports.submitQuizAnswers = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: 'Answers must be an array'
            });
        }

        const progress = await UserProgress.findOne({ username: req.user.username });
        
        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'User progress not found'
            });
        }

        const lessonIndex = progress.lessons.findIndex(l => l.lesson_id === lessonId);
        
        if (lessonIndex === -1) {
            progress.lessons.push({
                lesson_id: lessonId,
                status: 'started',
                quiz_answers: answers,
                last_accessed: new Date()
            });
        } else {
            progress.lessons[lessonIndex].quiz_answers = answers;
            progress.lessons[lessonIndex].last_accessed = new Date();
        }

        // Menghitung skor, BELUM FINAL
        const score = answers.filter(answer => answer.is_correct).length / answers.length * 100;
        
        if (lessonIndex === -1) {
            progress.lessons[progress.lessons.length - 1].score = score;
            if (score >= 70) {
                progress.lessons[progress.lessons.length - 1].status = 'completed';
            }
        } else {
            progress.lessons[lessonIndex].score = score;
            if (score >= 70) {
                progress.lessons[lessonIndex].status = 'completed';
            }
        }

        await progress.save();

        res.json({
            success: true,
            data: {
                progress,
                score,
                passed: score >= 70
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error submitting quiz answers'
        });
    }
};

module.exports = exports;