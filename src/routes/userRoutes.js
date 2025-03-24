const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', userController.signup);

router.use(authMiddleware); 
router.post('/profile', userController.updateProfile);
router.get('/auth/check-status', userController.checkAuthStatus);

module.exports = router;