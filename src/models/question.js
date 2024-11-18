const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    lesson: {
        type: Number,
        required: true,
        index: true
    },
    question_no: {
        type: Number,
        required: true
    },
    question_text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false'],
        required: true
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }]
}, {
    collection: 'question'
});

questionSchema.index({ lesson: 1, question_no: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;