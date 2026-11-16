import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Duo Sanctuary - Capacitor Native App Configuration
 * 
 * Bundled offline-first inside APK (Option A)
 * Assets are served locally from device storage for instant launch (<0.2s)
 * with zero server costs and zero cold-start delay.
 */
const config: CapacitorConfig = {
  appId: 'com.duo.sanctuary',
  appName: 'Duo',
  webDir: 'mobile-shell',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FAF6EF',
    captureInput: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
      serverClientId: '685551715911-iu0a1t3l79v07i9pller8t7rvm20vedf.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

