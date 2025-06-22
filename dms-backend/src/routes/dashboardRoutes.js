const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// @route   GET /dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', dashboardController.getStats);

module.exports = router; 