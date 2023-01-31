module.exports = {
  name: 'GasMeUp',
  slug: 'gas-me-up',
  owner: 'mmcardle',
  version: '1.0.5',
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
    supportsTablet: true,
    bundleIdentifier: 'com.Virintus.GasMeUp',
    buildNumber: '1.0.5',
    config: {
      googleMapsApiKey: process.env.GOOGLE_IOS_SDK_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.Virintus.GasMeUp',
    versionCode: 470010005,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'ca421c93-c21f-4e6b-a62c-52b626a5bbac',
    },
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  plugins: [
    'expo-apple-authentication',
  ],
};
