const { Order, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get assigned orders for a delivery boy
// @route   GET /api/delivery/orders
// @access  Private
const getAssignedOrders = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const orders = await Order.findAll({
      where: { deliveryBoyId },
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error('Error in getAssignedOrders:', err, err?.stack);
    res.status(500).json({ message: 'Failed to fetch assigned orders' });
  }
};

// @desc    Get order details
// @route   GET /api/delivery/orders/:orderId
// @access  Private
const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  // TODO: Implement logic to fetch order details for orderId
  res.json({ message: `Route to get details for order ${orderId}` });
};

// @desc    Update order status
// @route   PUT /api/delivery/orders/:orderId/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  // TODO: Implement logic to update order status
  res.json({ message: `Route to update order ${orderId} status to ${status}` });
};

// @desc    Get order history with period filtering
// @route   GET /api/delivery/orders/history
// @access  Private
const getOrderHistory = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const { period = 'week' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch orders for the period
    const orders = await Order.findAll({
      where: {
        deliveryBoyId,
        status: 'delivered',
        updatedAt: {
          [Op.gte]: startDate
        }
      },
      order: [['updatedAt', 'DESC']]
    });

    // Calculate stats
    const totalOrders = orders.length;
    const totalEarnings = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    // Calculate average delivery time (simplified - using 30 minutes as default)
    const averageDeliveryTime = totalOrders > 0 ? 30 : 0;

    res.json({
      orders,
      stats: {
        totalOrders,
        totalEarnings: Math.round(totalEarnings),
        averageDeliveryTime
      }
    });
  } catch (err) {
    console.error('Error in getOrderHistory:', err);
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
};

module.exports = {
  getAssignedOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderHistory,
}; 