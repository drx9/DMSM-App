const express = require('express');
const router = express.Router();
const {
  getAssignedOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderHistory,
} = require('../controllers/deliveryController');
const { authenticateToken, isDeliveryBoy } = require('../middleware/auth');

router.get('/orders', authenticateToken, isDeliveryBoy, getAssignedOrders);
router.get('/orders/history', authenticateToken, isDeliveryBoy, getOrderHistory);
router.get('/orders/:orderId', authenticateToken, isDeliveryBoy, getOrderDetails);
router.put('/orders/:orderId/status', authenticateToken, isDeliveryBoy, updateOrderStatus);

module.exports = router; 