#!/bin/bash

echo "🚀 Building Cc Calendar Android App..."

# Change to frontend directory
cd /app/frontend

echo "📦 Installing dependencies..."
yarn install

echo "🔧 Building React app..."
yarn build

echo "📱 Syncing with Capacitor..."
npx cap sync android

echo "🔨 Building Android APK..."
cd android

# Build the APK
./gradlew assembleDebug

echo "✅ Android APK built successfully!"
echo "📍 APK Location: /app/frontend/android/app/build/outputs/apk/debug/app-debug.apk"

# Copy APK to easy access location
cp app/build/outputs/apk/debug/app-debug.apk /app/cc-calendar.apk

echo "✅ APK copied to /app/cc-calendar.apk"
echo "📱 You can now install this APK on your Android device!"

# Display file info
ls -lh /app/cc-calendar.apk

echo ""
echo "🎉 Build Complete!"
echo "📋 Next Steps:"
echo "1. Download /app/cc-calendar.apk"
echo "2. Enable 'Install from Unknown Sources' on your Android device"
echo "3. Install the APK"
echo "4. Enjoy Cc Calendar on your Android device!"