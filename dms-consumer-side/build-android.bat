@echo off
echo Setting up shorter build paths for Windows...

REM Set environment variables for shorter build paths
set GRADLE_USER_HOME=C:\tmp\.gradle
set ANDROID_BUILD_CACHE_DIR=C:\tmp\android-build-cache
set CMAKE_BUILD_DIR=C:\tmp\cmake-build

REM Create directories if they don't exist
if not exist "C:\tmp" mkdir "C:\tmp"
if not exist "C:\tmp\.gradle" mkdir "C:\tmp\.gradle"
if not exist "C:\tmp\android-build-cache" mkdir "C:\tmp\android-build-cache"
if not exist "C:\tmp\cmake-build" mkdir "C:\tmp\cmake-build"

echo Build directories created at C:\tmp\
echo Starting Android build...

REM Run the Android build
npx expo run:android --variant release

pause
