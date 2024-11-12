const express = require('express');
const router = express.Router();
const userProgressController = require('../controllers/userProgressController');
const auth = require('../middleware/auth');

router.get('/', auth, userProgressController.getUserProgress);
router.put('/theme', auth, userProgressController.updateTheme);
router.get('/lessons', auth, userProgressController.getLessonProgress);
router.put('/lessons/:lessonId', auth, userProgressController.updateLessonProgress);
router.post('/quiz/:lessonId', auth, userProgressController.submitQuizAnswers);

module.exports = router;