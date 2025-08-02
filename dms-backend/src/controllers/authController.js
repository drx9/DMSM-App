const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const authService = require('../services/authService');
const { verifyFirebaseToken: verifyFirebaseTokenService, createOrUpdateUserFromFirebase } = require("../services/firebaseService");

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
          isVerified: user.isVerified,
        },
      });
    }

    // --- PHONE + OTP LOGIN ---
    else if (phoneNumber) {
      // Phone login is now handled by Firebase Phone Auth
      return res.status(400).json({
        success: false,
        message: 'Phone login is now handled by Firebase. Please use the phone authentication flow in the app.',
      });
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

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phoneNumber, email, password, isVerified = false, dateOfBirth, gender } = req.body;

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
      isVerified: isVerified, // Use the provided verification status
      dateOfBirth,
      gender,
    });

    // If user is already verified (Firebase OTP), skip sending OTP
    if (!isVerified) {
      // Send OTP for traditional registration
      const type = phoneNumber ? 'PHONE' : 'EMAIL';
      await authService.sendOTP(user, type);
    }

    return res.json({
      success: true,
      message: isVerified ? 'Registration successful!' : 'Registration successful. Please verify your account.',
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
    let userId = req.params.userId;
    if (userId === 'me') {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
      }
      userId = req.user.id;
    }
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt', 'photo', 'gender', 'dateOfBirth']
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

const updateUser = async (req, res) => {
  try {
    let userId = req.params.userId;
    if (userId === 'me') {
      userId = req.user.id;
    }
    const { name, email, phoneNumber, gender, dateOfBirth, photo } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (photo) user.photo = photo;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    const fs = require('fs');

    cloudinary.config({
      cloud_name: 'dpdlmdl5x',
      api_key: '298524623458681',
      api_secret: 'I6SZkaBwqNIC6sHUXWUhO2BnTY8',
    });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      resource_type: 'image',
    });

    // Clean up local file
    fs.unlinkSync(req.file.path);

    // Update user photo with Cloudinary URL
    user.photo = result.secure_url;
    await user.save();

    res.json({ photo: user.photo });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

const deliveryLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, role: 'delivery' } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
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
  } catch (error) {
    console.error('Delivery login error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

async function verifyFirebaseToken(req, res) {
  const { idToken } = req.body;
  try {
    const decodedToken = await verifyFirebaseTokenService(idToken);
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ error: "No phone number in token" });
    }
    // Find or create user
    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      user = await User.create({
        name: "User" + phoneNumber.slice(-4),
        phoneNumber,
        password: Math.random().toString(36).slice(-8), // random password, not used
        isVerified: true,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { id: user.id, phoneNumber: user.phoneNumber, name: user.name } });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

const verifyFirebaseEmail = async (req, res) => {
  try {
    const { email, actionCode } = req.body;
    
    if (!email || !actionCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and action code are required' 
      });
    }

    // Verify the email action code
    const decodedToken = await verifyFirebaseTokenService(actionCode);
    
    if (decodedToken.email === email) {
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid email verification'
      });
    }
  } catch (error) {
    console.error('Firebase email verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

const verifyFirebasePhone = async (req, res) => {
  try {
    const { phoneNumber, idToken } = req.body;
    
    if (!phoneNumber || !idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and ID token are required' 
      });
    }

    // Verify the phone ID token
    const decodedToken = await verifyFirebaseTokenService(idToken);
    
    if (decodedToken.phone_number === phoneNumber) {
      res.json({
        success: true,
        message: 'Phone verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid phone verification'
      });
    }
  } catch (error) {
    console.error('Firebase phone verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Phone verification failed'
    });
  }
};

// Simple phone OTP methods
const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in memory (in production, use Redis or database)
    if (!global.phoneOTPs) {
      global.phoneOTPs = new Map();
    }
    global.phoneOTPs.set(phoneNumber, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    console.log(`[Phone OTP] Generated OTP for ${phoneNumber}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

const verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and OTP are required' 
      });
    }

    // Get stored OTP
    if (!global.phoneOTPs) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    const stored = global.phoneOTPs.get(phoneNumber);
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      global.phoneOTPs.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Check if too many attempts
    if (stored.attempts >= 3) {
      global.phoneOTPs.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (stored.otp === otp) {
      // Clear OTP after successful verification
      global.phoneOTPs.delete(phoneNumber);
      
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      // Increment attempts
      stored.attempts += 1;
      global.phoneOTPs.set(phoneNumber, stored);
      
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// Phone-based login endpoint
const phoneLogin = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }
    
    // Find user by phone number
    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      // User doesn't exist, return success: false to indicate registration needed
      return res.json({ success: false, message: "User not found" });
    }
    
    // User exists, generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        phoneNumber: user.phoneNumber, 
        name: user.name,
        isVerified: user.isVerified 
      } 
    });
  } catch (err) {
    console.error('Phone login error:', err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  login,
  register,
  adminPasswordLogin,
  getUserById,
  googleLogin,
  updateUser,
  changePassword,
  uploadAvatar,
  deleteUser,
  deliveryLogin,
  verifyFirebaseToken,
  verifyFirebaseEmail,
  verifyFirebasePhone,
  sendPhoneOTP,
  verifyPhoneOTP,
  phoneLogin,
}; 