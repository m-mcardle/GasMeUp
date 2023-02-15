require('dotenv').config();

module.exports = {
  name: 'GasMeUp',
  slug: 'gas-me-up',
  owner: 'mmcardle',
  version: '1.0.11',
  orientation: 'portrait',
  icon: './assets/car.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/ca421c93-c21f-4e6b-a62c-52b626a5bbac',
  },
  assetBundlePatterns: [
    '**/*',
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.Virintus.GasMeUp',
    buildNumber: '1.0.11',
    config: {
      googleMapsApiKey: process.env.GOOGLE_IOS_SDK_KEY,
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.Virintus.GasMeUp',
    versionCode: 470010011,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'ca421c93-c21f-4e6b-a62c-52b626a5bbac',
    },
    firebaseAPIKey: process.env.FIREBASE_API_KEY,
    prodFirebaseAPIKey: process.env.PROD_FIREBASE_API_KEY,
    apiKey: process.env.API_KEY,
    useDevAPI: process.env.USE_DEV_API,
    devAPIURL: process.env.DEV_API_URL,
    exchangeRateAPIKey: process.env.EXCHANGE_RATE_API_KEY,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  plugins: [
    'expo-apple-authentication',
    'expo-notifications',
  ],
  privacy: 'public',
  jsEngine: 'hermes',
};
