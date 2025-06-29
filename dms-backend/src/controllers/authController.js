const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { phoneNumber, email, password } = req.body;

    // --- EMAIL + PASSWORD LOGIN ---
    if (email && password) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please check your email or sign up.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your password.',
        });
      }

      // Login successful, generate JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // --- PHONE + OTP LOGIN ---
    else if (phoneNumber) {
      const user = await User.findOne({ where: { phoneNumber } });

      if (user) {
        // User exists, send OTP
        await authService.sendOTP(user, 'PHONE');
        return res.json({
          success: true,
          message: 'OTP sent successfully.',
          userExists: true,
          userId: user.id,
        });
      } else {
        // User does not exist, prompt for signup
        return res.json({
          success: true,
          message: 'User does not exist. Please proceed to signup.',
          userExists: false,
          phoneNumber,
        });
      }
    }

    // --- INVALID INPUT ---
    else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a phone number or an email and password.',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, otp, type } = req.body;
    const token = await authService.verifyOTP(userId, otp, type);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(400).json({ message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const type = user.phoneNumber ? 'PHONE' : 'EMAIL';
    await authService.sendOTP(user, type);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      userId: user.id,
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

    // Build the where clause for checking existing user
    const whereClause = [];
    if (phoneNumber) whereClause.push({ phoneNumber });
    if (email) whereClause.push({ email });

    if (whereClause.length === 0) {
      return res.status(400).json({ message: 'Phone number or email is required.' });
    }

    const existingUser = await User.findOne({
      where: { [require('sequelize').Op.or]: whereClause },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this phone number or email' });
    }

    // Create new user
    const user = await User.create({
      name,
      phoneNumber,
      email,
      password, // The model hook will hash this
      isVerified: false,
    });

    // Send OTP
    const type = phoneNumber ? 'PHONE' : 'EMAIL';
    await authService.sendOTP(user, type);

    return res.json({
      success: true,
      message: 'Registration successful. Please verify your account.',
      userId: user.id,
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const adminPasswordLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (error) {
    console.error('Admin password login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt']
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = user.toJSON();
    if ('photo' in user) userObj.photo = user.photo || null;
    res.json(userObj);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const googleLogin = async (req, res) => {
  // Implementation of googleLogin function
};

module.exports = {
  login,
  verifyOTP,
  resendOTP,
  register,
  adminPasswordLogin,
  getUserById,
  googleLogin,
}; 