const db = require('../models');
const { Offer, Product, OfferProduct } = db;
const { Op } = require('sequelize');
const { emitToRole } = require('../socket');
const { ExpoPushToken } = require('../models');
// Removed old push service - using FCM instead

const offerController = {
    // Create a new offer
    createOffer: async (req, res) => {
        try {
            console.log('Offer body (create):', req.body);
            const { name, description, startDate, endDate, isActive, products, banner_image } = req.body;
            const offer = await Offer.create({ name, description, startDate, endDate, isActive, banner_image });
            if (products && Array.isArray(products)) {
                for (const prod of products) {
                    await OfferProduct.create({
                        offerId: offer.id,
                        productId: prod.productId,
                        extraDiscount: prod.extraDiscount || 0,
                        customOfferText: prod.customOfferText || null,
                    });
                }
            }
            // Real-time: notify all consumers and admins
            emitToRole('admin', 'offer_created', { offerId: offer.id });
            emitToRole('consumer', 'offer_created', { offerId: offer.id });
            // Push: notify all users (optional, can filter by role)
            // const tokens = await ExpoPushToken.findAll();
            // for (const t of tokens) {
            //   await sendPushNotification(t.token, 'New Offer', `A new offer is available!`, { offerId: offer.id });
            // }
            res.status(201).json(offer);
        } catch (err) {
            console.error('Error creating offer:', err);
            res.status(500).json({ message: 'Error creating offer' });
        }
    },

    // Get all offers (admin)
    getAllOffers: async (req, res) => {
        try {
            const offers = await Offer.findAll({
                include: [{
                    model: Product,
                    as: 'products',
                    through: { attributes: ['extraDiscount', 'customOfferText'] },
                    attributes: ['id', 'name', 'description', 'price', 'images', 'stock', 'isActive']
                }],
                order: [['createdAt', 'DESC']],
            });
            res.json(offers);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching offers' });
        }
    },

    // Get active offers (for consumer)
    getActiveOffers: async (req, res) => {
        try {
            const now = new Date();
            // Create date-only versions for comparison (removes time component)
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            console.log('🔍 Fetching active offers with date range:', {
                today: today.toISOString(),
                tomorrow: tomorrow.toISOString(),
                currentTime: now.toISOString()
            });
            
            const offers = await Offer.findAll({
                where: {
                    isActive: true,
                    startDate: { [Op.lt]: tomorrow },  // startDate < tomorrow (includes today)
                    endDate: { [Op.gte]: today },      // endDate >= today
                },
                include: [{
                    model: Product,
                    as: 'products',
                    through: { attributes: ['extraDiscount', 'customOfferText'] },
                    attributes: ['id', 'name', 'description', 'price', 'images', 'stock', 'isActive']
                }],
                order: [['createdAt', 'DESC']],
            });
            
            console.log('📦 Found offers:', offers.length);
            offers.forEach(offer => {
                console.log('🎯 Offer:', {
                    id: offer.id,
                    name: offer.name,
                    startDate: offer.startDate,
                    endDate: offer.endDate,
                    isActive: offer.isActive,
                    banner_image: offer.banner_image ? 'Present' : 'Missing'
                });
            });
            
            res.json(offers);
        } catch (err) {
            console.error('❌ Error fetching active offers:', err);
            res.status(500).json({ message: 'Error fetching active offers' });
        }
    },

    // Debug endpoint - get all active offers regardless of date
    getAllActiveOffers: async (req, res) => {
        try {
            console.log('🔍 Debug: Fetching ALL active offers (no date filter)');
            
            const offers = await Offer.findAll({
                where: {
                    isActive: true,
                },
                include: [{
                    model: Product,
                    as: 'products',
                    through: { attributes: ['extraDiscount', 'customOfferText'] },
                    attributes: ['id', 'name', 'description', 'price', 'images', 'stock', 'isActive']
                }],
                order: [['createdAt', 'DESC']],
            });
            
            console.log('📦 Debug: Found offers:', offers.length);
            offers.forEach(offer => {
                console.log('🎯 Debug Offer:', {
                    id: offer.id,
                    name: offer.name,
                    startDate: offer.startDate,
                    endDate: offer.endDate,
                    isActive: offer.isActive,
                    banner_image: offer.banner_image ? 'Present' : 'Missing'
                });
            });
            
            res.json(offers);
        } catch (err) {
            console.error('❌ Error fetching all active offers:', err);
            res.status(500).json({ message: 'Error fetching all active offers' });
        }
    },

    // Get a single offer by ID (admin)
    getOfferById: async (req, res) => {
        try {
            const { id } = req.params;
            const offer = await Offer.findByPk(id, {
                include: [{
                    model: Product,
                    as: 'products',
                    through: { attributes: ['extraDiscount', 'customOfferText'] },
                }],
            });
            if (!offer) return res.status(404).json({ message: 'Offer not found' });
            res.json(offer);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching offer' });
        }
    },

    // Update offer
    updateOffer: async (req, res) => {
        try {
            console.log('Offer body (update):', req.body);
            const { id } = req.params;
            const { name, description, startDate, endDate, isActive, products, banner_image } = req.body;
            const offer = await Offer.findByPk(id);
            if (!offer) return res.status(404).json({ message: 'Offer not found' });
            await offer.update({ name, description, startDate, endDate, isActive, banner_image });
            // Update products
            if (products && Array.isArray(products)) {
                await OfferProduct.destroy({ where: { offerId: id } });
                for (const prod of products) {
                    await OfferProduct.create({
                        offerId: id,
                        productId: prod.productId,
                        extraDiscount: prod.extraDiscount || 0,
                        customOfferText: prod.customOfferText || null,
                    });
                }
            }
            // Real-time: notify all consumers and admins
            emitToRole('admin', 'offer_updated', { offerId: id });
            emitToRole('consumer', 'offer_updated', { offerId: id });
            res.json(offer);
        } catch (err) {
            res.status(500).json({ message: 'Error updating offer' });
        }
    },

    // Delete offer
    deleteOffer: async (req, res) => {
        try {
            const { id } = req.params;
            await OfferProduct.destroy({ where: { offerId: id } });
            await Offer.destroy({ where: { id } });
            // Real-time: notify all consumers and admins
            emitToRole('admin', 'offer_deleted', { offerId: id });
            emitToRole('consumer', 'offer_deleted', { offerId: id });
            res.json({ message: 'Offer deleted' });
        } catch (err) {
            res.status(500).json({ message: 'Error deleting offer' });
        }
    },
};

module.exports = offerController; 