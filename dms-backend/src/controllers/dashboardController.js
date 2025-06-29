const { Op } = require('sequelize');
const Product = require('../models/Product');
const User = require('../models/User');

// In a real app, you'd have an Order model
// const Order = require('../models/Order');

exports.getStats = async (req, res, next) => {
    try {
        // These are placeholder stats. We'll implement the real logic later.
        const totalRevenue = 12345; // Placeholder
        const totalOrders = 150; // Placeholder
        const totalCustomers = await User.count({ where: { role: 'consumer' } });
        const lowStockItems = await Product.count({ where: { stock: { [Op.lte]: 10 } } });

        res.json({
            totalRevenue,
            totalOrders,
            totalCustomers,
            lowStockItems,
        });
    } catch (error) {
        next(error);
    }
}; 