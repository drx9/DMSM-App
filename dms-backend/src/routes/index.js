const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const orderRoutes = require('./orderRoutes');
const cartRoutes = require('./cartRoutes');
const addressRoutes = require('./addressRoutes');
const paymentRoutes = require('./paymentRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const uploadRoutes = require('./uploadRoutes');
const couponRoutes = require('./couponRoutes');
const serviceablePincodeController = require('../controllers/serviceablePincodeController');
const userRoutes = require('./userRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/payment-methods', paymentRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/upload-avatar', uploadRoutes);
router.use('/coupons', couponRoutes);
router.use('/offers', require('./offerRoutes'));
router.use('/users', userRoutes);
router.get('/serviceable-pincodes/public', serviceablePincodeController.getAllPublic);

module.exports = router; 