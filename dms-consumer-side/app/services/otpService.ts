import { phoneAuthService } from './phoneAuthService';

// Use simple phone auth for now (can be upgraded to Firebase later)
export const otpService = phoneAuthService;
export default otpService; 