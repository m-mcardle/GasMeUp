require('dotenv').config();

module.exports = {
  name: 'GasMeUp',
  slug: 'gas-me-up',
  owner: 'mmcardle',
  originalFullName: '@mmcardle/GasMeUp',
  version: '1.0.18',
  orientation: 'portrait',
  icon: './assets/car.png',
  splash: {
    image: './assets/splash-screen.png',
    resizeMode: 'contain',
    backgroundColor: '#6F61FE',
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
    buildNumber: '1.0.18',
    config: {
      googleMapsApiKey: process.env.GOOGLE_IOS_SDK_KEY,
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['location'],
      NSLocationAlwaysUsageDescription: 'GasMeUp will access your location for functionality purposes only. Some examples of this would be to allow you to start tracking your location to record your trip manually while driving.',
      NSLocationWhenInUseUsageDescription: "GasMeUp will access your location for functionality purposes only. Some examples of this would be to allow you to use your 'Current Location' as a start or end point or to determine which region's gas price to default to.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "GasMeUp will access your location for functionality purposes only. Some examples of this would be to allow you to use your 'Current Location' as a start or end point or to determine which region's gas price to default to.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.Virintus.GasMeUp',
    versionCode: 470010018,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'ca421c93-c21f-4e6b-a62c-52b626a5bbac',
    },
    // Firebase
    firebaseAPIKey: process.env.FIREBASE_API_KEY,
    prodFirebaseAPIKey: process.env.PROD_FIREBASE_API_KEY,

    // `/server` API
    apiKey: process.env.API_KEY,
    useDevAPI: process.env.USE_DEV_API,
    devAPIURL: process.env.DEV_API_URL,

    // Splitwise
    splitwiseTokenURL: process.env.SPLITWISE_TOKEN_URL,
    splitwiseAuthorizeURL: process.env.SPLITWISE_AUTHORIZE_URL,
    splitwiseClientID: process.env.SPLITWISE_CLIENT_ID,
    splitwiseConsumerSecret: process.env.SPLITWISE_CONSUMER_SECRET,
    splitwiseDevClientID: process.env.DEV_SPLITWISE_CLIENT_ID,
    splitwiseDevConsumerSecret: process.env.DEV_SPLITWISE_CONSUMER_SECRET,

    // Other
    exchangeRateAPIKey: process.env.EXCHANGE_RATE_API_KEY,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  plugins: [
    'expo-apple-authentication',
    'expo-notifications',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  scheme: 'gas-me-up',
  privacy: 'public',
  jsEngine: 'hermes',
};
