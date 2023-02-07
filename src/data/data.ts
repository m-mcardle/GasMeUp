import { ENV } from '../helpers/env';

export const serverUrl = ENV.USE_DEV_API === 'true' && ENV.DEV_API_URL
  ? ENV.DEV_API_URL
  : 'https://northern-bot-301518.uc.r.appspot.com';

export const mockTripCost = {
  cost: 420.69,
  distance: 120,
  gasPrice: 1.20,
};

export const mockSuggestions = {
  suggestions: [
    'Conestogo, ON, Canada',
    'Toronto, ON, Canada',
    'Waterloo, ON, Canada',
  ],
};

export const mockGasPrice = {
  price: 1.69,
};

export const mockDistance = {
  distance: 120,
  start: {
    lat: 43.54276157183944,
    lng: -80.50447815774582,
  },
  end: {
    lat: 43.6929259583315,
    lng: -79.35451499026206,
  },
};

// Helper method to easily mock requests
// Ex: route = '/suggestion?start=Toronto&end=Waterloo'
export async function fetchData(route: string, mock = false) {
  if (mock) {
    const resp = new Response();
    resp.json = () => new Promise((resolve) => {
      if (route.includes('suggestion')) {
        resolve(mockSuggestions);
      } else if (route.includes('gas')) {
        resolve(mockGasPrice);
      } else if (route.includes('distance')) {
        resolve(mockDistance);
      } else if (route.includes('trip-cost')) {
        resolve(mockTripCost);
      } else {
        console.warn('No mock data for this route - actually fetching data');
        resolve(fetch(`${serverUrl + route}&api_key=${ENV.API_KEY}`));
      }
    });
    return resp;
  }
  return fetch(`${serverUrl + route}&api_key=${ENV.API_KEY}`);
}

export default {
  fetchData,
  mockTripCost,
  mockSuggestions,
  mockGasPrice,
  mockDistance,
  serverUrl,
};
