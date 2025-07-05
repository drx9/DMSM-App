const { body } = require('express-validator');

const validateRegistration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const validateOTP = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits long'),
];

module.exports = {
  validateRegistration,
  validateOTP,
}; 