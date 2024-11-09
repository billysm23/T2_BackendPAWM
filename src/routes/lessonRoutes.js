const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', lessonController.getAllLessons);
router.get('/:id', lessonController.getLessonById);
router.get('/:id/prerequisites', lessonController.getLessonPrerequisites);

// Protected routes (AUTH)
router.post('/', auth, lessonController.createLesson);
router.put('/:id', auth, lessonController.updateLesson);
router.delete('/:id', auth, lessonController.deleteLesson);

module.exports = router;