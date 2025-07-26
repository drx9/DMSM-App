const express = require('express');
const { body } = require('express-validator');
const whatsappService = require('../services/whatsappService');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Send OTP via WhatsApp
router.post('/send-otp', [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { phoneNumber: phoneNumber.replace(/\D/g, '') } 
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // Send OTP via WhatsApp
    const result = await whatsappService.sendOTP(phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        data: {
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          messageId: result.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP and login
router.post('/verify-otp', [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { phoneNumber, otp } = req.body;

    // Verify OTP
    const verificationResult = whatsappService.verifyOTP(phoneNumber, otp);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // Find user
    const user = await User.findOne({ 
      where: { phoneNumber: phoneNumber.replace(/\D/g, '') } 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Register new user with WhatsApp OTP
router.post('/register', [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, phoneNumber, otp } = req.body;

    // Verify OTP first
    const verificationResult = whatsappService.verifyOTP(phoneNumber, otp);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { phoneNumber: phoneNumber.replace(/\D/g, '') } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      isVerified: true, // Phone is verified via WhatsApp
      role: 'customer'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        isVerified: newUser.isVerified
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// WhatsApp webhook for receiving messages
router.post('/webhook', async (req, res) => {
  try {
    const result = whatsappService.handleWebhook(req.body);
    
    if (result.success) {
      console.log('WhatsApp webhook received:', result.message);
      // Handle incoming messages here if needed
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);

  if (verificationResult) {
    res.status(200).send(verificationResult);
  } else {
    res.status(403).send('Forbidden');
  }
});

module.exports = router; 