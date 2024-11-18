const express = require('express');
const router = express.Router();
const userProgressController = require('../controllers/userProgressController');
const auth = require('../middleware/auth');

router.get('/', auth, userProgressController.getUserProgress);
router.get('/theme', auth, userProgressController.getTheme);
router.put('/theme', auth, userProgressController.updateTheme);
router.put('/lessons/:lessonId', auth, userProgressController.submitQuizAndUpdateProgress);

module.exports = router;