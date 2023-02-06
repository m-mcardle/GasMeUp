import Constants from 'expo-constants';

const expoConstants = Constants.expoConfig?.extra;

export const ENV = expoConstants
  ? {
    FIREBASE_API_KEY: expoConstants.firebaseAPIKey,
    PROD_FIREBASE_API_KEY: expoConstants.prodFirebaseAPIKey,
    API_KEY: expoConstants.apiKey,
    USE_DEV_API: expoConstants.useDevAPI,
    DEV_API_URL: expoConstants.devAPIURL,
  }
  : {
    FIREBASE_API_KEY: '',
    PROD_FIREBASE_API_KEY: '',
    API_KEY: '',
    USE_DEV_API: 'false',
    DEV_API_URL: '',
  };

if (process.env.NODE_ENV === 'development') {
  console.log('ENV:', ENV);

  if (ENV.USE_DEV_API === 'true') {
    console.warn('USE_DEV_API is enabled. Ensure that the API is running locally.');
  }
} else if (ENV.USE_DEV_API === 'true') {
  console.error('USE_DEV_API is enabled in production. This should not happen.');
  throw new Error('USE_DEV_API is enabled in production. This should not happen.');
}

export default ENV;
