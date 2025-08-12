const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const authService = require('../services/authService');
const { verifyFirebaseToken: verifyFirebaseTokenService, createOrUpdateUserFromFirebase } = require("../services/firebaseService");

const login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Phone login is now handled by Firebase Phone Auth
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for login.',
      });
    }

    // Phone login is handled by Firebase Phone Auth
    return res.status(400).json({
      success: false,
      message: 'Phone login is handled by Firebase. Please use the phone authentication flow in the app.',
    });
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
    console.log('Registration request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phoneNumber, email, password, isVerified = false, dateOfBirth, gender } = req.body;

    // Phone number is required
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone number format
    let normalizedPhoneNumber = phoneNumber;
    if (normalizedPhoneNumber.startsWith('+91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(3);
    }
    if (normalizedPhoneNumber.startsWith('91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(2);
    }
    if (normalizedPhoneNumber.length !== 10) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    // Check if user already exists with this phone number
    const existingUser = await User.findOne({
      where: { 
        [require('sequelize').Op.or]: [
          { phoneNumber: normalizedPhoneNumber },
          { phoneNumber: `+91${normalizedPhoneNumber}` }
        ]
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Generate strong random password if none provided
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // Create new user with normalized phone number
    const user = await User.create({
      name,
      phoneNumber: normalizedPhoneNumber,
      email,
      password: password || generateSecurePassword(), // ✅ Generate secure password if not provided
      isVerified: isVerified,
      dateOfBirth,
      gender,
    });

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
  const { idToken, phoneNumber: requestPhoneNumber } = req.body;
  try {
    console.log('🔐 Firebase token verification request:', { idToken: idToken ? 'present' : 'missing', requestPhoneNumber });
    
    const decodedToken = await verifyFirebaseTokenService(idToken);
    let phoneNumber = decodedToken.phone_number;
    
    console.log('✅ Decoded token:', decodedToken);
    console.log('📱 Phone number from token:', phoneNumber);
    console.log('📱 Phone number from request:', requestPhoneNumber);
    
    // If phone number is not in token, use the one from request body
    if (!phoneNumber && requestPhoneNumber) {
      phoneNumber = requestPhoneNumber;
      console.log('📱 Using phone number from request body:', phoneNumber);
    }
    
    if (!phoneNumber) {
      console.log('❌ No phone number found in token or request');
      return res.status(400).json({ error: "No phone number in token or request" });
    }
    
    // Normalize phone number format (remove +91 if present, ensure consistent format)
    let normalizedPhoneNumber = phoneNumber;
    if (normalizedPhoneNumber.startsWith('+91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(3);
    }
    if (normalizedPhoneNumber.startsWith('91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(2);
    }
    
    console.log('📱 Normalized phone number:', normalizedPhoneNumber);
    
    // Try to find user with multiple phone number formats
    let user = null;
    
    // Try different formats in order of likelihood
    const phoneFormats = [
      normalizedPhoneNumber,                    // 10-digit: 9998887771
      `+91${normalizedPhoneNumber}`,           // +91 prefix: +919998887771
      phoneNumber,                             // Original format
      normalizedPhoneNumber.substring(1)       // Without leading 9/8/7/6
    ];
    
    for (const format of phoneFormats) {
      console.log(`🔍 Trying phone format: ${format}`);
      user = await User.findOne({ 
        where: { 
          phoneNumber: format 
        } 
      });
      
      if (user) {
        console.log(`✅ User found with phone format: ${format}`);
        break;
      }
    }
    
    console.log('👤 User found:', user ? user.id : 'not found');
    
    if (!user) {
      // Check if this is a test mode token
      if (idToken && idToken.startsWith('test_mode_token_')) {
        console.log('🧪 Test mode: Creating new user for phone:', normalizedPhoneNumber);
        console.log('🧪 Test mode: Token details:', { idToken, phoneNumber, requestPhoneNumber });
        
        // Create a new user for test mode
        try {
          user = await User.create({
            phoneNumber: normalizedPhoneNumber,
            name: `Test User ${normalizedPhoneNumber}`,
            email: `test_${normalizedPhoneNumber}@example.com`,
            password: 'test_password_123', // Required field
            isVerified: true,
            role: 'user' // Use 'user' instead of 'customer' to match the enum
          });
          console.log('✅ Test mode: New user created:', user.id);
        } catch (createError) {
          console.error('❌ Test mode: Failed to create user:', createError);
          console.error('❌ Test mode: Create error details:', createError.message);
          return res.status(500).json({ error: "Failed to create test user: " + createError.message });
        }
      } else {
        // User does not exist, tell frontend to redirect to signup/profile completion
        console.log('🔄 User does not exist, redirecting to signup');
        return res.status(200).json({ success: false, reason: 'new_user', phoneNumber: normalizedPhoneNumber });
      }
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
      console.log('✅ User verified:', user.id);
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🎉 Login successful for user:', user.id);
    res.json({ success: true, token, user: { id: user.id, phoneNumber: user.phoneNumber, name: user.name } });
  } catch (err) {
    console.error('❌ Firebase token verification error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      idToken: idToken ? 'present' : 'missing'
    });
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

// Auto-login after registration (for phone-only users)
const autoLoginAfterRegistration = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Normalize phone number
    let normalizedPhoneNumber = phoneNumber;
    if (normalizedPhoneNumber.startsWith('+91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(3);
    }
    if (normalizedPhoneNumber.startsWith('91')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(2);
    }

    // Find user by phone number
    const user = await User.findOne({ 
      where: { phoneNumber: normalizedPhoneNumber } 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For phone-only users, skip password verification
    if (!password) {
      // No password provided - this is a phone-only user
      console.log('Phone-only login for user:', user.id);
    } else {
      // Password provided - verify it
      let isMatch = false;
      if (password.startsWith('default_')) {
        // For default passwords, check if it matches the pattern
        const expectedPassword = `default_${normalizedPhoneNumber}_`;
        isMatch = user.password.includes(expectedPassword);
      } else {
        // For regular passwords, use bcrypt comparison
        isMatch = await bcrypt.compare(password, user.password);
      }
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Auto-login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred'
    });
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
  autoLoginAfterRegistration,
}; 