const mongoose = require('mongoose');

const userQuizSchema = new mongoose.Schema({
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
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    answers: [{
        question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        user_answer: mongoose.Schema.Types.Mixed,
        is_correct: Boolean,
        answered_at: Date
    }],
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    attempts: {
        type: Number,
        default: 0
    },
    started_at: Date,
    completed_at: Date
}, {
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const UserQuiz = mongoose.model('UserQuiz', userQuizSchema);
module.exports = UserQuiz;