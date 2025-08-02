# Firebase Setup Guide

## 🔥 Firebase Installation & Configuration

### Step 1: Install Firebase Packages

```bash
cd dms-consumer-side
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging
```

### Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enter project name (e.g., "DMS Mart")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 3: Add Android App

1. In Firebase Console, click "Add app" → "Android"
2. Enter package name: `com.dmsm.dmsconsumerside`
3. Enter app nickname: "DMS Consumer App"
4. Click "Register app"
5. Download `google-services.json`
6. Place it in: `dms-consumer-side/android/app/google-services.json`

### Step 4: Enable Firebase Services

#### Authentication (for SMS OTP)
1. Go to Authentication → Sign-in methods
2. Enable "Phone" provider
3. Add test phone numbers (optional)

#### Cloud Messaging (for Push Notifications)
1. Go to Project Settings → Cloud Messaging
2. Note the Server key (for backend)

### Step 5: Backend Configuration

Add to your Railway environment variables:
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Step 6: Rebuild App

```bash
npx expo run:android
```

## ✅ Verification

After setup, the app should:
- ✅ Send real SMS OTPs to phone numbers
- ✅ Receive push notifications for order updates
- ✅ Show Firebase configuration success in console

## 🚨 Troubleshooting

### "Firebase is not installed" Error
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging
```

### "google-services.json not found" Error
- Ensure file is in `android/app/google-services.json`
- Check file permissions

### "SMS not received" Error
- Verify phone number format (+91XXXXXXXXXX)
- Check Firebase Authentication settings
- Ensure SMS quota not exceeded

### "Push notifications not working" Error
- Check FCM token generation
- Verify backend service account key
- Ensure app has notification permissions 