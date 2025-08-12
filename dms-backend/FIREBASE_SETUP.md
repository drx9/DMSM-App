# Firebase Phone Auth Setup Guide

## Overview
This backend now uses Firebase Phone Authentication instead of custom OTP. Firebase handles:
- Sending real SMS OTPs
- Verifying OTPs
- Token generation and verification

## Setup Steps

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to **Authentication** > **Sign-in method**
4. Enable **Phone** provider
5. Add your test phone numbers if needed

### 2. Get Firebase Admin SDK Credentials
1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. **IMPORTANT**: Keep this file secure and never commit it to git

### 3. Environment Configuration
Create a `.env` file in your backend folder with:

```bash
# Method 1: Service Account JSON (Recommended)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Method 2: Project ID only (for development)
FIREBASE_PROJECT_ID=your-firebase-project-id

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Other config...
```

### 4. How It Works Now

#### Before (Fake OTP):
- Backend generated random 6-digit numbers
- Stored OTPs in memory
- No real SMS was sent

#### After (Firebase Phone Auth):
- Frontend calls Firebase Phone Auth
- Firebase sends real SMS with OTP
- User enters OTP in Firebase
- Firebase returns ID token
- Backend verifies token with Firebase Admin SDK
- User is authenticated

### 5. Frontend Changes Needed
Your React Native app needs to:
1. Use `@react-native-firebase/auth` for phone authentication
2. Call `signInWithPhoneNumber(phoneNumber)` 
3. Handle the verification code
4. Send the ID token to your backend `/auth/firebase-login` endpoint

### 6. Test Mode
- Test mode still works with tokens starting with `test_mode_token_`
- This allows development without Firebase setup
- Format: `test_mode_token_<phone_number>`

### 7. Troubleshooting
- **"Firebase Admin SDK not configured"**: Set environment variables
- **"Invalid Firebase token"**: Check if token is expired or invalid
- **"Phone number not found"**: Ensure phone number format is consistent

## Security Notes
- Firebase Admin SDK has full access to your Firebase project
- Keep service account keys secure
- Use environment variables, never hardcode credentials
- Test mode should only be used in development
