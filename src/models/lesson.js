const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      unique: true
    },
    order: {
      type: Number,
      required: true
    },
    description: String,
    content: {
      type: String,
      required: true
    },
    previous_lesson_id: {
      type: String,
      ref: 'Lesson'
    }
  });
  
const Lesson = mongoose.model('Lesson', lessonSchema);  
module.exports = Lesson;