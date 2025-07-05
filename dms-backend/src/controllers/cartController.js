exports.getCartCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await CartItem.sum('quantity', { where: { userId } });
        res.json({ count: count || 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCartItemQuantity = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;
        if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });
        const item = await require('../models').CartItem.findOne({ where: { productId, userId } });
        if (!item) return res.status(404).json({ message: 'Cart item not found' });
        item.quantity = quantity;
        await item.save();
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}; 