import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Duo Sanctuary - Capacitor Native App Configuration
 * 
 * For Android APK builds:
 * - To test locally over Wi-Fi: set CAPACITOR_SERVER_URL="http://<YOUR_LOCAL_IP>:3000"
 * - To use production deployment: set CAPACITOR_SERVER_URL="https://your-duo-app.netlify.app"
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://duo-16pf.onrender.com';


const config: CapacitorConfig = {
  appId: 'com.duo.sanctuary',
  appName: 'Duo',
  webDir: 'mobile-shell',
  server: {
    url: serverUrl,
    cleartext: true, // Enables local HTTP during local network development
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FAF6EF',
    captureInput: true,
  },
  plugins: {},
};

export default config;
