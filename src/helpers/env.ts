import Constants from 'expo-constants';

const expoConstants = Constants.expoConfig?.extra;

export const ENV = expoConstants
  ? {
    FIREBASE_API_KEY: expoConstants.firebaseAPIKey,
    PROD_FIREBASE_API_KEY: expoConstants.prodFirebaseAPIKey,
    API_KEY: expoConstants.apiKey,
    USE_DEV_API: expoConstants.useDevAPI,
  }
  : {
    FIREBASE_API_KEY: '',
    PROD_FIREBASE_API_KEY: '',
    API_KEY: '',
    USE_DEV_API: false,
  };

export default ENV;
