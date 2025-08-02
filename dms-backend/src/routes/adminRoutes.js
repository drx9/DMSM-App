const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
// Removed old push service - using FCM instead
const { ExpoPushToken, User } = require('../models');

// Protect all admin routes
router.use(authenticateToken);
router.use(isAdmin);

// Send notification to all users
router.post('/send-notification', async (req, res) => {
  try {
    const { title, message, notificationType = 'promotional', data = {} } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // Get all unique user IDs who have push tokens
    const tokens = await ExpoPushToken.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });

    if (tokens.length === 0) {
      return res.status(404).json({ message: 'No users with push tokens found' });
    }

    // Group tokens by user ID
    const userTokens = {};
    tokens.forEach(token => {
      if (!userTokens[token.userId]) {
        userTokens[token.userId] = [];
      }
      userTokens[token.userId].push(token);
    });

    // Send notification to each user
    let successCount = 0;
    let failureCount = 0;

    for (const [userId, userTokenList] of Object.entries(userTokens)) {
      try {
        await sendNotificationWithPreferences(userId, title, message, data, notificationType);
        successCount++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Notification sent to ${successCount} users`,
      stats: {
        totalUsers: Object.keys(userTokens).length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get notification statistics
router.get('/notification-stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const usersWithTokens = await ExpoPushToken.count({
      distinct: true,
      col: 'userId'
    });

    res.json({
      totalUsers,
      usersWithTokens,
      notificationCoverage: totalUsers > 0 ? Math.round((usersWithTokens / totalUsers) * 100) : 0
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ message: 'Failed to get notification statistics' });
  }
});

// Send notification to specific users
router.post('/send-notification-to-users', async (req, res) => {
  try {
    const { userIds, title, message, notificationType = 'promotional', data = {} } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      try {
        await sendNotificationWithPreferences(userId, title, message, data, notificationType);
        successCount++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Notification sent to ${successCount} users`,
      stats: {
        totalRequested: userIds.length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error('Error sending targeted notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

module.exports = router; 