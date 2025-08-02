const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, userController.getProfile);

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'),
], userController.updateProfile);

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], userController.changePassword);

// Delete account
router.delete('/delete-account', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required'),
], userController.deleteAccount);

// Push token endpoints (public - no auth required for app initialization)
router.post('/register-expo-push-token', userController.registerExpoPushToken);
router.post('/remove-expo-push-token', userController.removeExpoPushToken);
router.post('/register-fcm-token', userController.registerFCMToken);



// Get user by ID (with 'me' support)
router.get('/:id', authenticateToken, async (req, res) => {
  let userId = req.params.id;
  if (userId === 'me') {
    userId = req.user.id;
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});



// Debug endpoint to test FCM notifications
router.post('/test-fcm-notification', async (req, res) => {
  try {
    console.log('[Backend] FCM test notification requested:', req.body);
    
    const { userId, title, message } = req.body;
    if (!userId || !title || !message) {
      console.log('[Backend] Missing required fields:', { userId, title, message });
      return res.status(400).json({ message: 'userId, title, and message are required' });
    }

    console.log('[Backend] Calling sendFCMNotificationToUser for user:', userId);
    const { sendFCMNotificationToUser } = require('../services/fcmService');
    const result = await sendFCMNotificationToUser(userId, title, message, { test: true });
    
    console.log('[Backend] FCM notification result:', result);
    
    if (result) {
      res.json({ success: true, message: 'FCM notification sent successfully' });
    } else {
      res.json({ success: false, message: 'FCM notification failed - check if user has FCM token' });
    }
  } catch (error) {
    console.error('[Backend] Error sending FCM notification:', error);
    res.status(500).json({ message: 'Failed to send FCM notification' });
  }
});

// Debug endpoint to check user FCM token (public - no auth required)
router.get('/check-fcm-token/:userId', async (req, res) => {
  try {
    console.log('[Backend] FCM token check requested for user:', req.params.userId);
    
    const { userId } = req.params;
    if (!userId) {
      console.log('[Backend] No userId provided');
      return res.status(400).json({ message: 'userId is required' });
    }

    console.log('[Backend] Looking up user:', userId);
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log('[Backend] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[Backend] User found, FCM token exists:', !!user.fcmToken);
    
    res.json({
      success: true,
      hasFCMToken: !!user.fcmToken,
      fcmToken: user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : null,
      userId: user.id
    });
  } catch (error) {
    console.error('[Backend] Error checking FCM token:', error);
    res.status(500).json({ message: 'Failed to check FCM token' });
  }
});

module.exports = router; 