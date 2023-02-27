import Constants from 'expo-constants';

export const DEV = process.env.NODE_ENV === 'development';

const expoConstants = Constants.expoConfig?.extra;

export const ENV = expoConstants
  ? {
    FIREBASE_API_KEY: expoConstants.firebaseAPIKey,
    PROD_FIREBASE_API_KEY: expoConstants.prodFirebaseAPIKey,
    API_KEY: expoConstants.apiKey,
    USE_DEV_API: expoConstants.useDevAPI,
    DEV_API_URL: expoConstants.devAPIURL,
    EXCHANGE_RATE_API_KEY: expoConstants.exchangeRateAPIKey,
    SPLITWISE_CLIENT_ID: DEV
      ? expoConstants.splitwiseDevClientID
      : expoConstants.splitwiseClientID,
    SPLITWISE_CONSUMER_SECRET: DEV
      ? expoConstants.splitwiseDevConsumerSecret
      : expoConstants.splitwiseConsumerSecret,
    SPLITWISE_AUTHORIZE_URL: expoConstants.splitwiseAuthorizeURL,
    SPLITWISE_TOKEN_URL: expoConstants.splitwiseTokenURL,
  }
  : {
    FIREBASE_API_KEY: '',
    PROD_FIREBASE_API_KEY: '',
    API_KEY: '',
    USE_DEV_API: 'false',
    DEV_API_URL: '',
    EXCHANGE_RATE_API_KEY: '',
    SPLITWISE_CLIENT_ID: '',
    SPLITWISE_CONSUMER_SECRET: '',
    SPLITWISE_AUTHORIZE_URL: '',
    SPLITWISE_TOKEN_URL: '',
  };

async function checkDevAPI() {
  console.log('Checking:', ENV.DEV_API_URL);
  try {
    const response = await fetch(ENV.DEV_API_URL);

    if (response.status !== 200) {
      throw new Error('Dev API is not running. Please start the API and try again.');
    }
  } catch (exception) {
    console.error('Dev API is not running. Please start the API and try again.');
  }
}

if (process.env.NODE_ENV === 'development') {
  console.log('ENV:', ENV);

  if (ENV.USE_DEV_API === 'true') {
    checkDevAPI();
  }
} else if (ENV.USE_DEV_API === 'true') {
  console.error('USE_DEV_API is enabled in production. This should not happen.');
}

export default ENV;
