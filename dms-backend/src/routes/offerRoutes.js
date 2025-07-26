const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public route for consumers (MUST come before parameterized routes)
router.get('/active', offerController.getActiveOffers);

// Admin routes
router.post('/', authenticateToken, isAdmin, offerController.createOffer);
router.get('/', authenticateToken, isAdmin, offerController.getAllOffers);
router.put('/:id', authenticateToken, isAdmin, offerController.updateOffer);
router.delete('/:id', authenticateToken, isAdmin, offerController.deleteOffer);
router.get('/:id', authenticateToken, isAdmin, offerController.getOfferById);

module.exports = router; 