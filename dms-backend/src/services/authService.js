const User = require('../models/User');
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

let twilioClient = null;
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
} catch (error) {
  console.log('Twilio not configured, SMS OTP will be logged to console');
}

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (user, type) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to database
  await OTP.create({
    userId: user.id,
    otp,
    type,
    expiresAt
  });

  if (type === 'PHONE') {
    if (twilioClient) {
      // Send OTP via SMS
      await twilioClient.messages.create({
        body: `Your DMS Mart verification code is: ${otp}`,
        to: user.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });
    } else {
      // Development mode: Log OTP to console
      console.log(`[DEV] OTP for ${user.phoneNumber}: ${otp}`);
    }
  } else {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Send OTP via Email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'DMS Mart Verification Code',
        text: `Your verification code is: ${otp}`
      });
    } else {
      // Development mode: Log OTP to console
      console.log(`[DEV] OTP for ${user.email}: ${otp}`);
    }
  }

  return true;
};

const verifyOTP = async (userId, otp, type) => {
  const otpRecord = await OTP.findOne({
    where: {
      userId,
      otp,
      type,
      isUsed: false,
      expiresAt: {
        [Op.gt]: new Date()
      }
    }
  });

  if (!otpRecord) {
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as used
  await otpRecord.update({ isUsed: true });

  // Update user verification status
  await User.update(
    { isVerified: true },
    { where: { id: userId } }
  );

  // Generate JWT token
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '7d' }
  );

  return token;
};

module.exports = {
  sendOTP,
  verifyOTP
}; 