const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

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

const upload = multer({ dest: path.join(__dirname, '../../uploads/avatars') });

// Routes
router.post(
  '/login',
  [
    body('phoneNumber').optional().isString(),
    body('email').optional().isEmail(),
    body('password').optional().isString()
  ],
  authController.login
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

router.post(
  '/admin-login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.adminPasswordLogin
);

router.get('/user/:userId', authController.getUserById);

router.post('/google', authController.googleLogin);

router.put('/user/:userId', authController.updateUser);
router.post('/user/:userId/change-password', authController.changePassword);
router.post('/user/:userId/avatar', upload.single('avatar'), authController.uploadAvatar);
router.delete('/user/:userId', authController.deleteUser);

router.post(
  '/delivery/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.deliveryLogin
);

router.get('/user/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phoneNumber: req.user.phoneNumber,
    isVerified: req.user.isVerified,
    isActive: req.user.isActive,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
    // add other fields as needed
  });
});

module.exports = router; 