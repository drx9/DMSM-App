const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Admin routes
router.post('/', authenticateToken, isAdmin, offerController.createOffer);
router.get('/', authenticateToken, isAdmin, offerController.getAllOffers);
router.put('/:id', authenticateToken, isAdmin, offerController.updateOffer);
router.delete('/:id', authenticateToken, isAdmin, offerController.deleteOffer);
router.get('/:id', authenticateToken, isAdmin, offerController.getOfferById);

// Public route for consumers
router.get('/active', offerController.getActiveOffers);

module.exports = router; 