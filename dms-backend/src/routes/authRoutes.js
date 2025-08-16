const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');

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
  .optional()  // ✅ Make password optional
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

// Rate limiting for security
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 signup requests per windowMs
  message: 'Too many signup attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.post(
  '/login',
  loginLimiter, // ✅ Add rate limiting
  [
    body('phoneNumber').isString().withMessage('Phone number is required')
  ],
  authController.login
);

router.post(
  '/register',
  signupLimiter, // ✅ Add rate limiting
  [
    nameValidation,
    body('phoneNumber').matches(/^[0-9]{10}$/).withMessage('Phone number is required and must be 10 digits'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    passwordValidation,
    addressValidation,
    cityValidation,
    stateValidation,
    postalCodeValidation,
    countryValidation,
    dateOfBirthValidation,
    genderValidation,
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

// Auto-login after registration
router.post('/auto-login', [
  body('phoneNumber').isString().withMessage('Phone number is required'),
  body('password').optional().isString().withMessage('Password must be a string if provided') // ✅ Make password optional
], authController.autoLoginAfterRegistration);

router.put('/user/:userId', authController.updateUser);
router.post('/user/:userId/change-password', authController.changePassword);
router.post('/user/:userId/avatar', upload.single('avatar'), authController.uploadAvatar);
router.delete('/user/:userId', authController.deleteUser);

// Firebase Auth routes
router.post('/firebase/verify-email', authController.verifyFirebaseEmail);
router.post('/firebase/verify-phone', authController.verifyFirebasePhone);

router.post(
  '/delivery/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.deliveryLogin
);

router.post("/firebase-login", authController.verifyFirebaseToken);

// OTP routes removed - Firebase Phone Auth handles OTP verification

// Simple phone OTP routes
router.post('/send-phone-otp', authController.sendPhoneOTP);
router.post('/verify-phone-otp', authController.verifyPhoneOTP);

// New OTP verification routes for frontend compatibility
router.post('/verify', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Get current user profile (for /auth/user/me)
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt', 'photo', 'gender', 'dateOfBirth']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = user.toJSON();
    if ('photo' in user) userObj.photo = user.photo || null;
    res.json(userObj);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

module.exports = router; 