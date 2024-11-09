const mongoose = require('mongoose');

const userLessonSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    status: {
        type: String,
        enum: ['locked', 'unlocked', 'in_progress', 'completed'],
        default: 'locked'
    },
    started_at: Date,
    completed_at: Date,
    last_accessed: Date
}, {
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const UserLesson = mongoose.model('UserLesson', userLessonSchema);
module.exports = UserLesson;