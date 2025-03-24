const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

// All profile routes should be protected
router.use(authMiddleware);

router.post('/', profileController.updateProfile);
router.get('/', profileController.getProfile);

module.exports = router;