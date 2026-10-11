import type { ExpoConfig } from 'expo/config';

const BUNDLE_ID = 'com.mediary.app';

const config: ExpoConfig = {
  name: 'Mediary',
  slug: 'mediary',
  scheme: 'mediary',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  primaryColor: '#8BA893',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        'Mediary uses your camera to scan a barcode on medication packaging so the number can be saved with a stock batch. No medication information is looked up automatically.',
      NSFaceIDUsageDescription: 'Mediary can use Face ID to quickly and securely unlock the app.',
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#F7F3EC',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['android.permission.CAMERA'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-splash-screen',
    'expo-secure-store',
    'expo-apple-authentication',
    [
      'expo-camera',
      {
        cameraPermission:
          'Mediary uses your camera to scan a barcode on medication packaging so the number can be saved with a stock batch.',
      },
    ],
    [
      'expo-notifications',
      {
        // TODO: design a proper monochrome Android notification icon and
        // point `icon` at it before release — Android silently falls back
        // to the app icon otherwise, which is a worse look in the status bar.
        color: '#8BA893',
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.REPLACE_ME',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
  },
  // Left out until `eas init` provides a real project ID: a placeholder here
  // makes EAS CLI fail with "Invalid UUID appId".
  extra: process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {},
};

export default config;
