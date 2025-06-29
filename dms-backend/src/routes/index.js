const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const orderRoutes = require('./orderRoutes');
const cartRoutes = require('./cartRoutes');
const addressRoutes = require('./addressRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);

module.exports = router; 