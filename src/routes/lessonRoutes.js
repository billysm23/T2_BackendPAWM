const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const auth = require('../middleware/auth');

// 4 card utama
router.get('/', lessonController.getAllLessons);
router.get('/:id', lessonController.getLessonById);

// Section spesifik
router.get('/:id/overview', lessonController.getLessonOverview);
router.get('/:id/content', lessonController.getLessonContent);
router.get('/:id/resources', lessonController.getLessonResources);
router.get('/:id/quiz', lessonController.getLessonQuiz);

module.exports = router;