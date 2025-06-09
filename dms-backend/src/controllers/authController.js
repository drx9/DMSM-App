const { validationResult } = require('express-validator');
const User = require('../models/User');
const authService = require('../services/authService');
const { Op } = require('sequelize'); // Import Op for OR queries

const initiateLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, email } = req.body;

    // Find user by phoneNumber or email
    const whereClause = {};
    if (phoneNumber) {
      whereClause.phoneNumber = phoneNumber;
    } else if (email) {
      whereClause.email = email;
    }

    const user = await User.findOne({
      where: whereClause
    });

    if (user) {
      // User exists, proceed with OTP login
      const type = phoneNumber ? 'PHONE' : 'EMAIL';
      await authService.sendOTP(user, type);

      return res.json({
        success: true,
        message: 'OTP sent successfully',
        userId: user.id,
        userExists: true
      });
    } else {
      // User does NOT exist, inform frontend to redirect to signup
      return res.json({
        success: true,
        message: 'User does not exist. Please proceed to signup.',
        userExists: false,
        phoneNumber // Send back the phone number for pre-filling the signup form
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    console.log('Verification request received:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, otp, type } = req.body;
    console.log('Verifying OTP for user:', userId);

    const token = await authService.verifyOTP(userId, otp, type);
    console.log('OTP verified successfully for user:', userId);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(400).json({ message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    console.log('Resend OTP request received:', req.body);
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', user.id);

    // Send new OTP
    const type = user.phoneNumber ? 'PHONE' : 'EMAIL';
    await authService.sendOTP(user, type);

    console.log('OTP sent successfully for user:', user.id);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phoneNumber, email, password } = req.body;

    // Check if user already exists
    const whereClause = {};
    if (phoneNumber) {
      whereClause.phoneNumber = phoneNumber;
    } else if (email) {
      whereClause.email = email;
    }

    const existingUser = await User.findOne({
      where: whereClause
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this phone number or email'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      phoneNumber,
      email,
      password,
      isVerified: false
    });

    // Send OTP
    const type = phoneNumber ? 'PHONE' : 'EMAIL';
    await authService.sendOTP(user, type);

    return res.json({
      success: true,
      message: 'Registration successful. Please verify your account.',
      userId: user.id
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  initiateLogin,
  verifyOTP,
  resendOTP,
  register
}; 