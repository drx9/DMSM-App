const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const db = require('../models'); // Added db import

// Public route for consumers (MUST come before parameterized routes)
router.get('/active', offerController.getActiveOffers);

// Debug route - get all active offers regardless of date (for testing)
router.get('/debug/active', offerController.getAllActiveOffers);

// Test route to check banner image accessibility
router.get('/test/banner/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;
        const offer = await db.Offer.findByPk(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json({
            offerId: offer.id,
            name: offer.name,
            banner_image: offer.banner_image,
            isActive: offer.isActive,
            startDate: offer.startDate,
            endDate: offer.endDate
        });
    } catch (err) {
        res.status(500).json({ message: 'Error testing banner' });
    }
});

// Admin routes
router.post('/', authenticateToken, isAdmin, offerController.createOffer);
router.get('/', authenticateToken, isAdmin, offerController.getAllOffers);
router.put('/:id', authenticateToken, isAdmin, offerController.updateOffer);
router.delete('/:id', authenticateToken, isAdmin, offerController.deleteOffer);
router.get('/:id', authenticateToken, isAdmin, offerController.getOfferById);

module.exports = router; 