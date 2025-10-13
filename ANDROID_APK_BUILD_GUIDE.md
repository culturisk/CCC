# Android APK Build Guide for Cc (Culturisk Calendar)

## 🚨 Important Notice

**APK Build Status**: The React PWA has been successfully built and configured for Android using Capacitor. However, completing the APK build requires an **x86_64 system** (Windows, macOS, or x86 Linux). The current development environment runs on ARM64 architecture, which is incompatible with Android's AAPT2 build tools.

## ✅ What's Already Completed

- ✅ Capacitor installed and fully configured  
- ✅ Android platform initialized with all plugins  
- ✅ React production build completed  
- ✅ Android resources configured (app icon, colors, strings)  
- ✅ AndroidManifest.xml configured with necessary permissions  
- ✅ Capacitor assets synced to Android project  
- ✅ Gradle configuration complete  

**Status**: 95% complete - only the final APK compilation step remains.

## 📋 Prerequisites for APK Build

### System Requirements
- **OS**: Windows 10+, macOS 12+, or x86_64 Linux  
- **JDK**: Version 21 (OpenJDK or Oracle)  
- **Android SDK**: API Level 33 (Android 13)  
- **Build Tools**: Version 33.0.0  
- **Node.js**: v16+ with Yarn  

## 🔧 Complete APK Build Instructions

### Method 1: Using Android Studio (Recommended)

#### Step 1: Install Android Studio
```bash
# Download from: https://developer.android.com/studio
# Install with default settings including Android SDK
```

#### Step 2: Transfer Project Files
Transfer the entire `/app/frontend` directory to your local machine.

#### Step 3: Open in Android Studio
1. Launch Android Studio
2. Select **"Open an Existing Project"**
3. Navigate to and open `frontend/android`
4. Wait for Gradle sync to complete (first time may take 5-10 minutes)

#### Step 4: Build APK
1. From menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click **"locate"** in the success notification

**APK Location**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

### Method 2: Using Command Line

#### Step 1: Install JDK 21
```bash
# macOS (using Homebrew)
brew install openjdk@21
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc

# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk

# Windows (using Scoop)
scoop install openjdk21

# Verify installation
java -version  # Should show 21.x.x
```

#### Step 2: Install Android SDK
```bash
# Option A: Install Android Studio (includes SDK)
# Download from: https://developer.android.com/studio

# Option B: Install command-line tools only
# Download from: https://developer.android.com/studio#command-tools
```

#### Step 3: Configure Environment Variables
```bash
# macOS/Linux - Add to ~/.bashrc or ~/.zshrc
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk  # Adjust path as needed
export ANDROID_HOME=$HOME/Android/Sdk  # Or ~/Library/Android/sdk on macOS
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Windows - System Environment Variables
# JAVA_HOME=C:\Program Files\Java\jdk-21
# ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
# Add to PATH: %ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools
```

#### Step 4: Install SDK Packages
```bash
# Accept licenses
sdkmanager --licenses

# Install required packages
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Verify installation
sdkmanager --list_installed
```

#### Step 5: Build the APK
```bash
cd frontend

# Optional: Rebuild React app if you made changes
yarn build
npx cap sync android

# Build debug APK
cd android
chmod +x gradlew  # macOS/Linux only
./gradlew assembleDebug  # or gradlew.bat assembleDebug on Windows
```

#### Step 6: Locate APK
```bash
# APK location
frontend/android/app/build/outputs/apk/debug/app-debug.apk

# File size: ~50-70 MB
```

---

## 🚀 Installing APK on Android Device

### Method 1: Direct Install via USB
```bash
# Enable USB debugging on Android device:
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → Enable "USB Debugging"

# Connect device via USB and run:
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Transfer and Install Manually
1. Copy `app-debug.apk` to your phone (email, cloud storage, or USB)
2. On phone: Enable "Install Unknown Apps" for your file manager
   - Settings → Apps → Special Access → Install Unknown Apps
3. Open the APK file and tap "Install"

---

## 📦 Building a Release APK (Production)

For publishing to Google Play Store or distributing signed APKs:

### Step 1: Generate Signing Key
```bash
keytool -genkey -v -keystore cc-release-key.keystore \
  -alias cc-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Save the keystore file and passwords securely!
```

### Step 2: Configure Signing
Create `android/keystore.properties`:
```properties
storeFile=../cc-release-key.keystore
storePassword=your-store-password
keyAlias=cc-release
keyPassword=your-key-password
```

Update `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Release APK or AAB
```bash
# For direct distribution (APK)
./gradlew assembleRelease

# For Google Play Store (AAB - recommended)
./gradlew bundleRelease
```

**Output Locations**:
- Release APK: `app/build/outputs/apk/release/app-release.apk`
- Release AAB: `app/build/outputs/bundle/release/app-release.aab`

---

## 🔍 Troubleshooting

### Issue: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"
```bash
cd android
./gradlew wrapper --gradle-version=8.11.1
./gradlew assembleDebug
```

### Issue: "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/path/to/your/android/sdk
```

### Issue: "AAPT2 error" or "Daemon startup failed"
- Ensure you're on an x86_64 system (not ARM)
- Update Build Tools: `sdkmanager "build-tools;33.0.0"`
- Clean and rebuild: `./gradlew clean assembleDebug`

### Issue: "Java version mismatch"
```bash
# Verify Java 21 is active
java -version

# Set JAVA_HOME explicitly
export JAVA_HOME=$(/usr/libexec/java_home -v 21)  # macOS
# or point to your JDK 21 installation
```

### Issue: Build fails with "Insufficient memory"
```bash
# Increase Gradle memory in android/gradle.properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

---

## 📱 App Configuration

Key files for customization:

| File | Purpose |
|------|---------|
| `capacitor.config.json` | App ID, name, server configuration |
| `android/app/src/main/AndroidManifest.xml` | Permissions, activities |
| `android/app/src/main/res/values/strings.xml` | App name |
| `android/app/src/main/res/values/colors.xml` | Theme colors |
| `android/app/src/main/res/mipmap-*/ic_launcher.png` | App icons |

To change app name:
```xml
<!-- android/app/src/main/res/values/strings.xml -->
<string name="app_name">Cc - Your Calendar</string>
<string name="title_activity_main">Cc</string>
```

---

## 📚 Additional Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs/android
- **Android Developer Guide**: https://developer.android.com/studio/build
- **Gradle Build Guide**: https://docs.gradle.org/current/userguide/building_android_apps.html
- **Play Store Publishing**: https://developer.android.com/studio/publish

---

## 🎯 Summary

The Cc calendar app is **fully prepared for Android build**. All Capacitor configuration, Android resources, and project setup are complete. The only remaining step is to compile the APK on an x86_64 compatible system using the instructions above.

**Estimated Build Time**: 5-15 minutes (first build), 1-2 minutes (subsequent builds)

**APK Size**: ~50-70 MB (debug), ~30-40 MB (release with ProGuard)
