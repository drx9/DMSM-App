const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// Get all wishlist items for a user
router.get('/:userId', wishlistController.getWishlist);
// Add to wishlist
router.post('/add', wishlistController.addToWishlist);
// Remove from wishlist
router.post('/remove', wishlistController.removeFromWishlist);

module.exports = router; 