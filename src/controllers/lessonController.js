const { Lesson } = require('../models');

exports.getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find()
            .sort({ order: 1 });

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
        const lesson = await Lesson.findById(req.params.id)
            .populate('prerequisites', 'title order');

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

exports.createLesson = async (req, res) => {
    try {
        const { title, order, description, content, prerequisites } = req.body;

        if (!title || !order || !content) {
            return res.status(400).json({
                success: false,
                error: 'Please provide title, order, and content'
            });
        }

        const existingLesson = await Lesson.findOne({ order });
        if (existingLesson) {
            return res.status(400).json({
                success: false,
                error: 'A lesson with this order already exists'
            });
        }

        const lesson = new Lesson({
            title,
            order,
            description,
            content,
            prerequisites
        });

        await lesson.save();

        res.status(201).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating lesson'
        });
    }
};

exports.updateLesson = async (req, res) => {
    try {
        const { title, order, description, content, prerequisites } = req.body;
        const lessonId = req.params.id;

        // cek lesson ada/tidak
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        // cek masalah ketika urutan diganti
        if (order && order !== lesson.order) {
            const existingLesson = await Lesson.findOne({ 
                order, 
                _id: { $ne: lessonId } 
            });
            if (existingLesson) {
                return res.status(400).json({
                    success: false,
                    error: 'A lesson with this order already exists'
                });
            }
        }

        const updatedLesson = await Lesson.findByIdAndUpdate(
            lessonId,
            {
                title,
                order,
                description,
                content,
                prerequisites
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedLesson
        });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating lesson'
        });
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        // cek prerequisit
        const dependentLessons = await Lesson.find({
            prerequisites: req.params.id
        });

        if (dependentLessons.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete lesson: it is a prerequisite for other lessons',
                dependentLessons: dependentLessons.map(l => ({
                    id: l._id,
                    title: l.title
                }))
            });
        }

        await lesson.deleteOne();

        res.json({
            success: true,
            message: 'Lesson deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting lesson'
        });
    }
};

exports.getLessonPrerequisites = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id)
            .populate('prerequisites', 'title order description');

        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lesson.prerequisites
        });
    } catch (error) {
        console.error('Error fetching prerequisites:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching prerequisites'
        });
    }
};

module.exports = exports;