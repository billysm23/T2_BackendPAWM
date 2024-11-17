const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  lessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'started', 'completed'],
      default: 'locked'
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedContent: {
      type: [String],
      default: []
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    attempts: {
      type: Number,
      default: 0
    },
    quizResults: [{
      attemptNumber: Number,
      score: Number,
      completedAt: Date,
      answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        selectedAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean
      }]
    }]
  }]
}, {
  timestamps: true
});

userProgressSchema.index({ 'lessons.lessonId': 1, userId: 1 });
userProgressSchema.index({ userId: 1, 'lessons.status': 1 });

userProgressSchema.methods.calculateOverallProgress = function() {
  if (!this.lessons.length) return 0;
  
  const completedLessons = this.lessons.filter(l => l.status === 'completed');
  return (completedLessons.length / this.lessons.length) * 100;
};

userProgressSchema.methods.isLessonAccessible = function(lessonId, prerequisites) {
  const lessonProgress = this.lessons.find(l => l.lessonId.equals(lessonId));
  if (!lessonProgress) return false;
  
  if (!prerequisites || prerequisites.length === 0) return true;
  
  return prerequisites.every(preReqId => {
    const preReqProgress = this.lessons.find(l => l.lessonId.equals(preReqId));
    return preReqProgress && preReqProgress.status === 'completed';
  });
};

// Auto unlock next lesson when current is completed
userProgressSchema.pre('save', async function(next) {
  const modifiedLesson = this.lessons.find(l => l.isModified('status') && l.status === 'completed');
  
  if (modifiedLesson) {
    const nextLesson = await mongoose.model('Lesson').findOne({
      order: { $gt: modifiedLesson.order },
      _id: { $nin: this.lessons.map(l => l.lessonId) }
    }).sort({ order: 1 });

    if (nextLesson) {
      this.lessons.push({
        lessonId: nextLesson._id,
        status: 'unlocked'
      });
    }
  }
  next();
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;