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

// Push token endpoints (public - no auth required for app initialization)
router.post('/register-expo-push-token', userController.registerExpoPushToken);
router.post('/remove-expo-push-token', userController.removeExpoPushToken);

module.exports = router; 