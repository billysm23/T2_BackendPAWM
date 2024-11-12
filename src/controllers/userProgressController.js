const UserProgress = require('../models/userProgress');
const User = require('../models/user');

// Get semua progress
exports.getUserProgress = async (req, res) => {
    try {
        let progress = await UserProgress.findOne({ username: req.user.username });
        // Jika tidak ada progress yang sudah berjalan
        if (!progress) {
            progress = new UserProgress({
                username: req.user.username,
                theme: 'light',
                lessons: []
            });
            await progress.save();
        }

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching user progress'
        });
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

// Update lesson progress
exports.updateLessonProgress = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { status } = req.body;

        if (!['locked', 'unlocked', 'started', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }

        let progress = await UserProgress.findOne({ username: req.user.username });
        
        if (!progress) {
            progress = new UserProgress({
                username: req.user.username,
                theme: 'light',
                lessons: [{
                    lesson_id: lessonId,
                    status,
                    last_accessed: new Date()
                }]
            });
        } else {
            const lessonIndex = progress.lessons.findIndex(l => l.lesson_id === lessonId);
            
            if (lessonIndex === -1) {
                progress.lessons.push({
                    lesson_id: lessonId,
                    status,
                    last_accessed: new Date()
                });
            } else {
                progress.lessons[lessonIndex].status = status;
                progress.lessons[lessonIndex].last_accessed = new Date();
            }
        }

        await progress.save();

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Update lesson progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating lesson progress'
        });
    }
};

// Submit quiz answers
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