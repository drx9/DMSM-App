const { validationResult } = require('express-validator');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { emitToUser } = require('../socket');
const { ExpoPushToken } = require('../models');
const { sendPushNotification } = require('../services/pushService');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'profileImage', 'isVerified', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, email, phoneNumber, profileImage } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    // Check if phone number is being changed and if it's already taken
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ where: { phoneNumber } });
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number is already taken' });
      }
    }

    // Update user profile
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profileImage) updateData.profileImage = profileImage;

    await user.update(updateData);
    // Real-time: notify user
    emitToUser(user.id, 'profile_updated', {});
    // Push: notify user
    const tokens = await ExpoPushToken.findAll({ where: { userId: user.id } });
    for (const t of tokens) {
      await sendPushNotification(t.token, 'Profile Updated', 'Your profile was updated.', {});
    }
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    // Real-time: notify user
    emitToUser(user.id, 'password_changed', {});
    // Push: notify user
    const tokens = await ExpoPushToken.findAll({ where: { userId: user.id } });
    for (const t of tokens) {
      await sendPushNotification(t.token, 'Password Changed', 'Your password was changed.', {});
    }
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Real-time: notify user
    emitToUser(user.id, 'account_deleted', {});
    // Push: notify user
    const tokens = await ExpoPushToken.findAll({ where: { userId: user.id } });
    for (const t of tokens) {
      await sendPushNotification(t.token, 'Account Deleted', 'Your account was deleted.', {});
    }
    // Delete user account
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Register Expo push token
exports.registerExpoPushToken = async (req, res) => {
  try {
    const { userId, expoPushToken, platform, deviceId } = req.body;
    if (!userId || !expoPushToken) return res.status(400).json({ message: 'userId and expoPushToken required' });
    
    // Check if token already exists for this user
    let entry = await ExpoPushToken.findOne({ where: { userId, token: expoPushToken } });
    
    if (!entry) {
      // Create new token entry
      entry = await ExpoPushToken.create({ 
        userId, 
        token: expoPushToken,
        platform: platform || 'unknown',
        deviceId: deviceId || 'unknown'
      });
    } else {
      // Update existing entry with new platform/device info
      await entry.update({
        platform: platform || entry.platform,
        deviceId: deviceId || entry.deviceId
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Push token registered successfully',
      tokenId: entry.id
    });
  } catch (err) {
    console.error('Error registering push token:', err);
    res.status(500).json({ message: 'Failed to register push token' });
  }
};

// Remove Expo push token
exports.removeExpoPushToken = async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ message: 'userId and token required' });
    await ExpoPushToken.destroy({ where: { userId, token } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove push token' });
  }
};

// Register FCM token
exports.registerFCMToken = async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;
    if (!userId || !fcmToken) {
      return res.status(400).json({ message: 'userId and fcmToken required' });
    }
    
    // Update user's FCM token
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({ fcmToken });
    
    console.log(`FCM token registered for user ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'FCM token registered successfully'
    });
  } catch (err) {
    console.error('Error registering FCM token:', err);
    res.status(500).json({ message: 'Failed to register FCM token' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  registerExpoPushToken: exports.registerExpoPushToken,
  removeExpoPushToken: exports.removeExpoPushToken,
  registerFCMToken: exports.registerFCMToken
}; 