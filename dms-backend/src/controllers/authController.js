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

module.exports = {
  login,
  verifyOTP,
  resendOTP,
  register,
  adminPasswordLogin,
  getUserById,
  googleLogin,
  updateUser,
  changePassword,
  uploadAvatar,
  deleteUser,
  deliveryLogin,
}; 