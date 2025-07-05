const { Wishlist, Product } = require('../models');

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
        if (deleted) return res.json({ success: true });
        res.status(404).json({ error: 'Wishlist entry not found' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
}; 