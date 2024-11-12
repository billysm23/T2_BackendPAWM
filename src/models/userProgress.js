const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    ref: 'User'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  lessons: [{
    lesson_id: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'started', 'completed'],
      default: 'locked'
    },
    quiz_answers: [{
      question_id: String,
      selected_answer: mongoose.Schema.Types.Mixed,
      is_correct: Boolean
    }],
    score: {
      type: Number,
      default: 0
    },
    last_accessed: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;