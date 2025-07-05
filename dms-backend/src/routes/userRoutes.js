const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'),
], userController.updateProfile);

// Change password
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], userController.changePassword);

// Delete account
router.delete('/delete-account', [
  body('password').notEmpty().withMessage('Password is required'),
], userController.deleteAccount);

module.exports = router; 