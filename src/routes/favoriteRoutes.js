const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/toggle', favoriteController.toggleFavorite);

router.get('/check/:listingId', favoriteController.checkFavoriteStatus);

router.get('/', favoriteController.getUserFavorites);

module.exports = router;