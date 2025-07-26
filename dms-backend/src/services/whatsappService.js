const axios = require('axios');
const crypto = require('crypto');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    this.apiVersion = 'v18.0'; // Update to latest version
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in memory (in production, use Redis or database)
  static otpStore = new Map();

  // Store OTP with expiration (5 minutes)
  storeOTP(phoneNumber, otp) {
    const expiration = Date.now() + (5 * 60 * 1000); // 5 minutes
    WhatsAppService.otpStore.set(phoneNumber, {
      otp,
      expiration,
      attempts: 0
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();
  }

  // Get stored OTP
  getStoredOTP(phoneNumber) {
    const stored = WhatsAppService.otpStore.get(phoneNumber);
    if (!stored) return null;
    
    if (Date.now() > stored.expiration) {
      WhatsAppService.otpStore.delete(phoneNumber);
      return null;
    }
    
    return stored;
  }

  // Increment attempts
  incrementAttempts(phoneNumber) {
    const stored = WhatsAppService.otpStore.get(phoneNumber);
    if (stored) {
      stored.attempts++;
      WhatsAppService.otpStore.set(phoneNumber, stored);
    }
  }

  // Clean up expired OTPs
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [phoneNumber, stored] of WhatsAppService.otpStore.entries()) {
      if (now > stored.expiration) {
        WhatsAppService.otpStore.delete(phoneNumber);
      }
    }
  }

  // Format phone number for WhatsApp (remove + and add country code if needed)
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    // If it starts with 91 (India), keep it
    if (formatted.startsWith('91')) {
      return formatted;
    }
    
    // If it's 10 digits, assume it's Indian number and add 91
    if (formatted.length === 10) {
      return `91${formatted}`;
    }
    
    return formatted;
  }

  // Send OTP via WhatsApp
  async sendOTP(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const otp = this.generateOTP();
      
      // Store OTP
      this.storeOTP(formattedPhone, otp);

      const message = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'otp_verification',
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp
                },
                {
                  type: 'text',
                  text: 'DMS Mart'
                },
                {
                  type: 'text',
                  text: '5 minutes'
                }
              ]
            }
          ]
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp OTP sent successfully:', {
        phoneNumber: formattedPhone,
        messageId: response.data.messages?.[0]?.id
      });

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        messageId: response.data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('WhatsApp OTP send error:', error.response?.data || error.message);
      
      // If template doesn't exist, send a simple text message
      if (error.response?.data?.error?.code === 100) {
        return await this.sendSimpleOTP(phoneNumber);
      }
      
      return {
        success: false,
        message: 'Failed to send OTP via WhatsApp',
        error: error.response?.data || error.message
      };
    }
  }

  // Send simple text OTP (fallback)
  async sendSimpleOTP(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const otp = this.generateOTP();
      
      // Store OTP
      this.storeOTP(formattedPhone, otp);

      const message = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: `Your DMS Mart OTP is: ${otp}\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp simple OTP sent successfully:', {
        phoneNumber: formattedPhone,
        messageId: response.data.messages?.[0]?.id
      });

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        messageId: response.data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('WhatsApp simple OTP send error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to send OTP via WhatsApp',
        error: error.response?.data || error.message
      };
    }
  }

  // Verify OTP
  verifyOTP(phoneNumber, otp) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const stored = this.getStoredOTP(formattedPhone);
    
    if (!stored) {
      return {
        success: false,
        message: 'OTP expired or not found'
      };
    }

    if (stored.attempts >= 3) {
      WhatsAppService.otpStore.delete(formattedPhone);
      return {
        success: false,
        message: 'Too many attempts. Please request a new OTP'
      };
    }

    if (stored.otp === otp) {
      // OTP is correct, remove it from store
      WhatsAppService.otpStore.delete(formattedPhone);
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } else {
      // Increment attempts
      this.incrementAttempts(formattedPhone);
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
  }

  // Webhook verification
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  // Handle incoming webhook messages
  handleWebhook(body) {
    try {
      const { entry } = body;
      
      if (!entry || !entry[0] || !entry[0].changes || !entry[0].changes[0]) {
        return { success: false, message: 'Invalid webhook format' };
      }

      const change = entry[0].changes[0];
      
      if (change.value && change.value.messages && change.value.messages[0]) {
        const message = change.value.messages[0];
        
        return {
          success: true,
          message: {
            from: message.from,
            text: message.text?.body,
            timestamp: message.timestamp,
            type: message.type
          }
        };
      }

      return { success: false, message: 'No message found in webhook' };
    } catch (error) {
      console.error('Webhook handling error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }
}

module.exports = new WhatsAppService(); 