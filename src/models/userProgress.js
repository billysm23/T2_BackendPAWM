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
  lessonProgresses: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'completed'],
      default: 'locked'
    },
    quizScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAttemptAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

userProgressSchema.index({ 'lessonProgresses.lessonId': 1, userId: 1 });

// Membuka lesson berikutnya setelah sebuah lesson completed
userProgressSchema.pre('save', async function(next) {
  const completedLesson = this.lessonProgresses.find(l =>
    l.isModified('status') && l.status === 'completed'
  );
  
  if (completedLesson) {
    const lesson = await mongoose.model('Lesson').findById(completedLesson.lessonId);
    if (lesson) {
      const nextLesson = await mongoose.model('Lesson').findOne({
        order: lesson.order + 1
      });

      if (nextLesson) {
        const nextLessonProgress = this.lessonProgresses.find(
          lp => lp.lessonId.toString() === nextLesson._id.toString()
        );

        if (nextLessonProgress) {
          nextLessonProgress.status = 'unlocked';
        } else {
          this.lessonProgresses.push({
            lessonId: nextLesson._id,
            status: 'unlocked'
          });
        }
      }
    }
  }
  next();
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;