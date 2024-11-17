const mongoose = require('mongoose');

const additionalReadingSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  type: String
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  _id: String,
  order: Number,
  title: {
    type: String,
    required: true
  },
  description: String,
  duration: String,
  practiceTime: String,
  level: String,
  sections: Number,
  prerequisite: [{
    type: String,
    ref: 'Lesson'
  }],

  // Overview Section
  learningObjectives: [String],
  prerequisites: [String],
  topics: [{
    title: String,
    description: String,
    icon: String
  }],

  // Content Section
  content: String,
  keyConcepts: [{
    title: String,
    description: String,
    example: String
  }],

  practiceProblems: [{
    title: String,
    description: String,
    hint: String
  }],

  // Resources Section
  additionalReading: [additionalReadingSchema],
  
  videos: [{
    title: String,
    url: String,
    duration: String,
    thumbnail: String
  }],

  documents: [{
    title: String,
    description: String,
    url: String,
    size: String
  }],

  externalLinks: [{
    title: String,
    description: String,
    url: String
  }],

  // Quiz Section
  quiz: [{
    _id: String,
    question_text: String,
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false']
    },
    options: [{
      _id: String,
      text: String,
      isCorrect: Boolean
    }],
    order: Number
  }]
}, {
  timestamps: true
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;