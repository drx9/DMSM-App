# DMS Consumer App - Rebuild and Test Guide

## Issues Fixed

1. **Infinite Recursion in LocationSelectionScreen** - Fixed the `getLocationSafe()` function that was calling itself
2. **Missing Location Permissions** - Added proper location permissions to app.json
3. **Google Maps API Key Safety** - Added checks to prevent crashes when API key is missing
4. **Better Error Handling** - Added comprehensive error handling throughout the app
5. **Error Boundary** - Added a global error boundary to catch unhandled errors
6. **AsyncStorage Race Condition** - Added delay after login to ensure data is written before navigation

## Steps to Rebuild and Test

### 1. Set Environment Variables in EAS
```bash
# Set your Google Maps API key
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "your_actual_google_maps_api_key"

# Set your API URL
eas secret:create --scope project --name NEXT_PUBLIC_API_URL --value "https://dmsm-app-production-a35d.up.railway.app/api"
```

### 2. Update app.json with your Google Maps API Key
Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` with your actual Google Maps API key.

### 3. Rebuild the App
```bash
# Clean and rebuild
cd dms-consumer-side
npx expo install --fix
eas build --platform android --clear-cache
```

### 4. Test the App
1. Install the new APK
2. Try logging in with email/password
3. Check if the app navigates to the main screen without crashing
4. Test location selection if prompted

## What to Check

### If the app still crashes:
1. Check the logs using:
   ```bash
   adb logcat | grep -i "dms\|react\|expo"
   ```

2. Look for specific error messages in the console

3. Verify that your Google Maps API key is valid and has the following APIs enabled:
   - Maps SDK for Android
   - Places API
   - Geocoding API

### Common Issues:
- **Location Permission Denied**: The app will now handle this gracefully
- **Google Maps API Key Missing**: The app will show a warning but won't crash
- **Network Errors**: Better error handling prevents crashes

## Debugging Tips

1. **Enable Developer Mode** on your device
2. **Enable USB Debugging** 
3. **Use React Native Debugger** or Flipper for better debugging
4. **Check Metro logs** for any build issues

## Expected Behavior After Fixes

1. **Login Success**: App should navigate to main screen without crashing
2. **Location Selection**: Should work smoothly or show appropriate error messages
3. **Error Handling**: Any errors should be caught and displayed properly
4. **No Infinite Loops**: The app should not get stuck in loading states

## If Issues Persist

1. Check the backend API is responding correctly
2. Verify all environment variables are set correctly
3. Ensure the Google Maps API key has proper permissions
4. Check if there are any network connectivity issues

## Contact Support

If the app still crashes after following these steps, please provide:
1. The exact error message from the logs
2. The steps that lead to the crash
3. Your device model and Android version
4. The version of the app you're testing 