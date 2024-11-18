const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.get('/lesson/:lessonId', auth, quizController.getQuizByLesson);
router.post('/:lessonId/submit', auth, quizController.submitQuiz);

module.exports = router;