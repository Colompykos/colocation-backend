const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', authController.signup);

router.post('/admin/create', authController.createAdmin);

router.get('/logged-in', authMiddleware, authController.loggedIn);
router.get('/check-status', authMiddleware, authController.checkStatus);

module.exports = router;