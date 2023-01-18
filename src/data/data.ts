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
};

export async function fetchData(url: string, mock = false) {
  if (mock) {
    const resp = new Response();
    resp.json = () => new Promise((resolve) => {
      if (url.includes('suggestion')) {
        resolve(mockSuggestions);
      } else if (url.includes('gas')) {
        resolve(mockGasPrice);
      } else if (url.includes('distance')) {
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
