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

export async function fetchData(url: string, route: string, mock = false) {
  if (mock) {
    const resp = new Response();
    resp.json = () => new Promise((resolve) => {
      if (route.includes('suggestion')) {
        resolve(mockSuggestions);
      } else if (route.includes('gas')) {
        resolve(mockGasPrice);
      } else if (route.includes('distance')) {
        resolve(mockDistance);
      } else {
        resolve(mockTripCost);
      }
    });
    return resp;
  }
  return fetch(url);
}

export default {
  fetchData,
  mockTripCost,
  mockSuggestions,
  mockGasPrice,
  mockDistance,
};
