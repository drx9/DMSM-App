const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Admin routes
router.post('/', authenticateToken, isAdmin, couponController.createCoupon);
router.get('/', authenticateToken, isAdmin, couponController.getAllCoupons);
router.get('/:id', authenticateToken, isAdmin, couponController.getCouponById);
router.put('/:id', authenticateToken, isAdmin, couponController.updateCoupon);
router.delete('/:id', authenticateToken, isAdmin, couponController.deleteCoupon);

// Consumer: Apply coupon
router.post('/apply', couponController.applyCoupon);

module.exports = router; 