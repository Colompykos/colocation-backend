const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController'); 
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/create', userController.createAdmin);

router.get('/check', adminController.checkAdmin);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:userId/auth', adminController.deleteUserAuth);
router.post('/users/:userId/toggle-block', adminController.toggleBlockUser);
router.post('/users/:userId/verify', adminController.verifyUser);

module.exports = router;