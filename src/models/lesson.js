const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  _id: String,
  order: Number,
  title: String,
  description: String,
  duration: String,
  practiceTime: String,
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  sections: Number,
  prerequisite: [String],
  learningObjectives: [String],
  prerequisites: [String],
  
  topics: [{
    title: String,
    description: String,
    icon: String,
    _id: {
      $oid: String
    }
  }],

  content: String,

  keyConcepts: [{
    title: String,
    description: String,
    example: String,
    _id: {
      $oid: String
    }
  }],

  practiceProblems: [{
    title: String,
    description: String,
    hint: String,
    _id: {
      $oid: String
    }
  }],

  additionalReading: [{
    title: String,
    description: String,
    url: String,
    type: String
  }],

  videos: [{
    title: String,
    url: String,
    duration: String,
    thumbnail: String,
    _id: {
      $oid: String
    }
  }],

  documents: [{
    title: String,
    description: String,
    url: String,
    size: String,
    _id: {
      $oid: String
    }
  }],

  externalLinks: [{
    title: String,
    description: String,
    url: String,
    _id: {
      $oid: String
    }
  }],

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
  }],
});
  
const Lesson = mongoose.model('Lesson', lessonSchema);  
module.exports = Lesson;