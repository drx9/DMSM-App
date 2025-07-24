const { Coupon, CouponUsage, User, Order } = require('../models');
const { Op } = require('sequelize');

const couponController = {
  // Admin: Create coupon
  createCoupon: async (req, res) => {
    try {
      const { code, description, discountType, discountValue, maxUses } = req.body;
      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        maxUses,
        remainingUses: maxUses,
        isActive: true,
      });
      res.status(201).json(coupon);
    } catch (err) {
      res.status(500).json({ message: 'Error creating coupon', error: err.message });
    }
  },

  // Admin: List all coupons
  getAllCoupons: async (req, res) => {
    try {
      const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
      res.json(coupons);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching coupons', error: err.message });
    }
  },

  // Admin: Get coupon by id
  getCouponById: async (req, res) => {
    try {
      const coupon = await Coupon.findByPk(req.params.id);
      if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
      res.json(coupon);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching coupon', error: err.message });
    }
  },

  // Admin: Update coupon
  updateCoupon: async (req, res) => {
    try {
      const coupon = await Coupon.findByPk(req.params.id);
      if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
      const { code, description, discountType, discountValue, maxUses, isActive } = req.body;
      await coupon.update({
        code: code ? code.toUpperCase() : coupon.code,
        description,
        discountType,
        discountValue,
        maxUses,
        isActive,
      });
      // If maxUses changed, adjust remainingUses accordingly
      if (maxUses && maxUses !== coupon.maxUses) {
        coupon.remainingUses = Math.max(0, maxUses - (coupon.maxUses - coupon.remainingUses));
        await coupon.save();
      }
      res.json(coupon);
    } catch (err) {
      res.status(500).json({ message: 'Error updating coupon', error: err.message });
    }
  },

  // Admin: Delete coupon
  deleteCoupon: async (req, res) => {
    try {
      await CouponUsage.destroy({ where: { couponId: req.params.id } });
      await Coupon.destroy({ where: { id: req.params.id } });
      res.json({ message: 'Coupon deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting coupon', error: err.message });
    }
  },

  // Consumer: Apply coupon
  applyCoupon: async (req, res) => {
    try {
      const { code, userId, cartTotal } = req.body;
      if (!code || !userId || typeof cartTotal !== 'number') {
        return res.status(400).json({ message: 'code, userId, and cartTotal are required' });
      }
      const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), isActive: true } });
      if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon' });
      if (coupon.remainingUses <= 0) return res.status(400).json({ message: 'Coupon usage limit reached' });
      // Check if user has already used this coupon (optional: per-user limit)
      // const alreadyUsed = await CouponUsage.findOne({ where: { couponId: coupon.id, userId } });
      // if (alreadyUsed) return res.status(400).json({ message: 'You have already used this coupon' });
      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'flat') {
        discount = parseFloat(coupon.discountValue);
      } else if (coupon.discountType === 'percent') {
        discount = (parseFloat(coupon.discountValue) / 100) * cartTotal;
      }
      discount = Math.min(discount, cartTotal);
      const newTotal = cartTotal - discount;
      res.json({ discount, newTotal, coupon });
    } catch (err) {
      res.status(500).json({ message: 'Error applying coupon', error: err.message });
    }
  },

  // Internal: Mark coupon as used (called during order placement)
  markCouponUsed: async (couponCode, userId, orderId) => {
    const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase() } });
    if (!coupon) return;
    if (coupon.remainingUses > 0) {
      coupon.remainingUses -= 1;
      await coupon.save();
      await CouponUsage.create({ couponId: coupon.id, userId, orderId });
    }
  },
};

module.exports = couponController; 