import type { ExpoConfig } from 'expo/config';

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const BUNDLE_ID = 'nz.co.artifactai.mediary';

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
    '@react-native-community/datetimepicker',
    // Only register the Google URL scheme once a real iOS client exists: a
    // placeholder scheme is rejected by App Store Connect (ITMS-90158).
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      // Not a secret; `eas init` can't write to a dynamic config, so it lives here.
      projectId: process.env.EAS_PROJECT_ID ?? '5066a548-8b48-48bd-8fe1-be43d39fe580',
    },
  },
};

export default config;
