const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const phoneValidation = body('phoneNumber')
  .optional()
  .matches(/^[0-9]{10}$/)
  .withMessage('Invalid phone number format');

const emailValidation = body('email')
  .optional()
  .isEmail()
  .withMessage('Invalid email format');

const passwordValidation = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');

const nameValidation = body('name')
  .notEmpty()
  .withMessage('Name is required');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 })
  .withMessage('OTP must be 6 digits');

// Optional address/personal info validations
const addressValidation = body('address').optional().isString().withMessage('Address must be a string');
const cityValidation = body('city').optional().isString().withMessage('City must be a string');
const stateValidation = body('state').optional().isString().withMessage('State must be a string');
const postalCodeValidation = body('postalCode').optional().isString().withMessage('Postal code must be a string');
const countryValidation = body('country').optional().isString().withMessage('Country must be a string');
const dateOfBirthValidation = body('dateOfBirth').optional().isISO8601().toDate().withMessage('Date of birth must be a valid date (YYYY-MM-DD)');
const genderValidation = body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other');

// Routes
router.post(
  '/login',
  [phoneValidation, emailValidation],
  authController.initiateLogin
);

router.post(
  '/verify',
  [
    body('userId').isUUID().withMessage('Invalid user ID'),
    otpValidation,
    body('type').isIn(['PHONE', 'EMAIL']).withMessage('Invalid OTP type')
  ],
  authController.verifyOTP
);

router.post(
  '/resend-otp',
  [
    body('userId').isUUID().withMessage('Invalid user ID')
  ],
  authController.resendOTP
);

router.post(
  '/register',
  [
    nameValidation,
    body('phoneNumber').optional().matches(/^[0-9]{10}$/).withMessage('Invalid phone number format'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    passwordValidation,
    addressValidation,
    cityValidation,
    stateValidation,
    postalCodeValidation,
    countryValidation,
    dateOfBirthValidation,
    genderValidation,
    body('phoneNumber').custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error('Either phone number or email is required');
      }
      return true;
    }),
    body('email').custom((value, { req }) => {
      if (!value && !req.body.phoneNumber) {
        throw new Error('Either phone number or email is required');
      }
      return true;
    }),
  ],
  authController.register
);

module.exports = router; 