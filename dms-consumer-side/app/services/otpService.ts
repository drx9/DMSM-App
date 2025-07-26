import { whatsappAuthService } from './whatsappAuthService';
// import { firebaseOtpService } from './firebaseOtpService'; // Uncomment and implement if you want to use Firebase

const USE_WHATSAPP = process.env.EXPO_PUBLIC_USE_WHATSAPP_OTP === 'true';

// For now, fallback to WhatsApp OTP for both cases
export const otpService = USE_WHATSAPP ? whatsappAuthService : whatsappAuthService;
// If you implement firebaseOtpService, use:
// export const otpService = USE_WHATSAPP ? whatsappAuthService : firebaseOtpService;

export default otpService; 