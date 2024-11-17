const mongoose = require('mongoose');

const userQuizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    answers: [{
        questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        },
        selectedAnswer: mongoose.Schema.Types.Mixed,
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['in_progress', 'completed'],
        default: 'in_progress'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    score: Number,
    attempts: {
        type: Number,
        default: 1
    }
}, {
        timestamps: true
});

userQuizSchema.index({ userId: 1, lessonId: 1 });

const UserQuiz = mongoose.model('UserQuiz', userQuizSchema);
module.exports = UserQuiz;