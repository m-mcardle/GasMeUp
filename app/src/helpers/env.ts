import Constants from 'expo-constants';

export const DEV = process.env.NODE_ENV === 'development';

// Everything in `extra` ships inside the app bundle and can be read by anyone,
// so only public identifiers belong here. Secrets (Splitwise consumer secret,
// exchange-rate key, ...) live on the server.
const expoConstants = Constants.expoConfig?.extra;

export const ENV = expoConstants
  ? {
    FIREBASE_API_KEY: expoConstants.firebaseAPIKey,
    PROD_FIREBASE_API_KEY: expoConstants.prodFirebaseAPIKey,
    API_KEY: expoConstants.apiKey,
    USE_DEV_API: expoConstants.useDevAPI,
    DEV_API_URL: expoConstants.devAPIURL,
    SPLITWISE_CLIENT_ID: DEV
      ? expoConstants.splitwiseDevClientID
      : expoConstants.splitwiseClientID,
  }
  : {
    FIREBASE_API_KEY: '',
    PROD_FIREBASE_API_KEY: '',
    API_KEY: '',
    USE_DEV_API: 'false',
    DEV_API_URL: '',
    SPLITWISE_CLIENT_ID: '',
  };

async function checkDevAPI() {
  console.log('Checking:', ENV.DEV_API_URL);
  try {
    const response = await fetch(ENV.DEV_API_URL);

    if (response.status !== 200) {
      throw new Error('Dev API is not running. Please start the API and try again.');
    }
  } catch (exception) {
    console.warn('Dev API is not running. Please start the API and try again.');
  }
}

if (process.env.NODE_ENV === 'development') {
  // Log which values are configured, never the values themselves.
  const configured = Object.fromEntries(
    Object.entries(ENV).map(([key, value]) => [key, value ? 'set' : 'MISSING']),
  );
  console.log('ENV:', { ...configured, USE_DEV_API: ENV.USE_DEV_API, DEV_API_URL: ENV.DEV_API_URL });

  if (ENV.USE_DEV_API === 'true') {
    checkDevAPI();
  }
} else if (ENV.USE_DEV_API === 'true') {
  console.error('USE_DEV_API is enabled in production. This should not happen.');
}

export default ENV;
