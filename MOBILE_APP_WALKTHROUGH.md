# Native Mobile Conversion Walkthrough (Play Store + App Store + Capgo OTA + CI/CD)

This document provides complete technical reference and developer instructions for the **Umang Vision Academy** Capacitor native mobile conversion, Capgo Over-The-Air (OTA) update setup, and automated GitHub Actions CI/CD pipeline.

---

## 1. Overview & Architecture

- **App Identifier**: `com.umangvision.academy`
- **App Name**: `Umang Vision Academy`
- **Framework**: Capacitor 7 + React 19 + Vite + Tailwind CSS v4
- **Over-The-Air (OTA) Provider**: Capgo (`@capgo/capacitor-updater`)
- **Native Platforms**:
  - `client/android/`: Android Studio project
  - `client/ios/`: Xcode project

---

## 2. File & Configuration Map

| File Path | Description |
| :--- | :--- |
| [`client/capacitor.config.json`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/client/capacitor.config.json) | Main Capacitor configuration specifying app ID, web output dir (`dist`), and Capgo OTA settings. |
| [`client/src/components/common/MobileAppListener.jsx`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/client/src/components/common/MobileAppListener.jsx) | Native lifecycle handler (Android back button, socket resume reconnect, network status toasts, Capgo `notifyAppReady`). |
| [`client/src/main.jsx`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/client/src/main.jsx) | React application entry point mounting `<MobileAppListener />`. |
| [`.github/workflows/mobile-ota.yml`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/.github/workflows/mobile-ota.yml) | GitHub Actions CI/CD pipeline for web OTA releases and native change notifications. |
| [`client/android/`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/client/android/) | Native Android Studio Gradle project. |
| [`client/ios/`](file:///c:/Users/Shayan/Desktop/AICoaching/AICoachingPlatform/client/ios/) | Native iOS Xcode workspace. |

---

## 3. Native Mobile Handlers (`MobileAppListener.jsx`)

1. **Android Hardware Back Button**:
   - Listens to `@capacitor/app` `backButton` event.
   - Navigates backward via React Router or exits the app if on top-level routes (`/`, `/student-dashboard`, `/instructor-dashboard`, `/admin-dashboard`, `/staff-dashboard`, `/login`).

2. **App Resume & Socket Reconnection**:
   - Listens to `@capacitor/app` `appStateChange`.
   - When the app resumes from background, dispatches an `app-resume` event to ensure Socket.IO connections remain active.

3. **Network Connectivity Monitoring**:
   - Listens to `@capacitor/network` `networkStatusChange`.
   - Displays offline warning toasts when connectivity is lost and online notifications when restored.

4. **Capgo OTA Protection**:
   - Executes `CapacitorUpdater.notifyAppReady()` on mount to confirm bundle stability and prevent automatic rollbacks.

---

## 4. Commands Reference

Run all commands inside the `client/` directory:

```bash
# Build Vite production bundle
npm run build

# Synchronize web dist and plugins with native android & ios projects
npm run cap:sync

# Push Over-The-Air (OTA) bundle to Capgo production channel
npm run release:ota

# Open project in Android Studio (Windows / Mac)
npm run cap:android

# Open project in Xcode (Mac only)
npm run cap:ios
```

---

## 5. GitHub Actions CI/CD Pipeline (`.github/workflows/mobile-ota.yml`)

On every `push` to the `main` branch:
- **Web Changes (`client/src/**`, `client/public/**`)**: Automatically builds the Vite bundle and uploads a new OTA release to Capgo using the `CAPGO_TOKEN` secret.
- **Native Changes (`android/`, `ios/`, `capacitor.config.json`, `package.json`)**: Skips Capgo OTA upload and creates a GitHub Actions alert notifying that a manual store submission is required.

---

## 6. Store Submission & Release Guide

### 🤖 Android App Bundle (.aab) Submission (Play Store)

1. **Generate Signing Keystore**:
   ```bash
   keytool -genkey -v -keystore uva-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias uva-key
   ```
2. **Build Signed AAB**:
   - Open `client/android` in Android Studio.
   - Go to **Build > Generate Signed Bundle / APK > Android App Bundle (.aab)**.
   - Select `uva-release-key.jks` and export the `.aab` file.
3. **Upload to Google Play Console**:
   - Upload the `.aab` under Production or Testing releases.

---

### 🍎 Apple App Store Submission (Mac Required)

1. Open `client/ios/App/App.xcworkspace` in Xcode on a Mac.
2. Under **Signing & Capabilities**, select your Apple Developer Team profile.
3. Choose **Product > Archive**.
4. In the Organizer window, click **Distribute App** and upload to **App Store Connect / TestFlight**.

> [!IMPORTANT]
> **Apple Guideline 3.1.1 (In-App Purchases vs Razorpay)**:
> Apple requires native In-App Purchases for digital content sold inside iOS apps.
> For v1 iOS approval, use the **Reader App pattern** (courses purchased on the web at `umangvisionacademy.com` are accessible in the app, but hide direct purchase buttons on iOS to avoid Apple's 30% IAP requirement).
