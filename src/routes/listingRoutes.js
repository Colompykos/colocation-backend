const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', listingController.getAllListings);
router.get('/:id', listingController.getListingById);

// Protected routes
router.post('/', authMiddleware, listingController.createListing);

module.exports = router;