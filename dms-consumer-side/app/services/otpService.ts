import { firebasePhoneAuthService } from './firebasePhoneAuthService';

// Use Firebase Phone Auth for REAL SMS OTP delivery
export const otpService = firebasePhoneAuthService;
export default otpService; 