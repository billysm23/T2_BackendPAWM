const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'matching', 'drag_drop', 'multi_select'],
        required: true
    },
    question_text: {
        type: String,
        required: true
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    order: Number,
    points: {
        type: Number,
        default: 1
    }
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;