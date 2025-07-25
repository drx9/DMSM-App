const { Wishlist, Product } = require('../models');
const { emitToUser, emitToRole } = require('../socket');
const { ExpoPushToken } = require('../models');
const { sendPushNotification } = require('../services/pushService');

// Get all wishlist items for a user
exports.getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        const wishlist = await Wishlist.findAll({
            where: { userId },
            include: [{ model: Product, as: 'product' }],
        });
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

// Add a product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        // Prevent duplicates
        const exists = await Wishlist.findOne({ where: { userId, productId } });
        if (exists) return res.status(200).json(exists);
        const entry = await Wishlist.create({ userId, productId });
        // Real-time: notify user
        emitToUser(userId, 'wishlist_updated', { productId, action: 'add' });
        // Push: notify user
        const tokens = await ExpoPushToken.findAll({ where: { userId } });
        for (const t of tokens) {
          await sendPushNotification(t.token, 'Wishlist Updated', 'Product added to your wishlist.', { productId });
        }
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

// Remove a product from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const deleted = await Wishlist.destroy({ where: { userId, productId } });
        if (deleted) {
          // Real-time: notify user
          emitToUser(userId, 'wishlist_updated', { productId, action: 'remove' });
          // Push: notify user
          const tokens = await ExpoPushToken.findAll({ where: { userId } });
          for (const t of tokens) {
            await sendPushNotification(t.token, 'Wishlist Updated', 'Product removed from your wishlist.', { productId });
          }
          return res.json({ success: true });
        }
        res.status(404).json({ error: 'Wishlist entry not found' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
}; 