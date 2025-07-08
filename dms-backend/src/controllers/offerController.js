const db = require('../models');
const { Offer, Product, OfferProduct } = db;
const { Op } = require('sequelize');

const offerController = {
    // Create a new offer
    createOffer: async (req, res) => {
        try {
            const { name, description, startDate, endDate, isActive, products } = req.body;
            const offer = await Offer.create({ name, description, startDate, endDate, isActive });
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
            const offers = await Offer.findAll({
                where: {
                    isActive: true,
                    startDate: { [Op.lte]: now },
                    endDate: { [Op.gte]: now },
                },
                include: [{
                    model: Product,
                    as: 'products',
                    through: { attributes: ['extraDiscount', 'customOfferText'] },
                }],
                order: [['createdAt', 'DESC']],
            });
            res.json(offers);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching active offers' });
        }
    },

    // Update offer
    updateOffer: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, startDate, endDate, isActive, products } = req.body;
            const offer = await Offer.findByPk(id);
            if (!offer) return res.status(404).json({ message: 'Offer not found' });
            await offer.update({ name, description, startDate, endDate, isActive });
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
            res.json({ message: 'Offer deleted' });
        } catch (err) {
            res.status(500).json({ message: 'Error deleting offer' });
        }
    },
};

module.exports = offerController; 