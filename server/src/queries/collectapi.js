export function GasPrices(location = 'canada') {
  return {
    method: 'get',
    url: `https://api.collectapi.com/gasPrice/${location}`,
    headers: {
      'content-type': 'application/json',
      authorization: `apikey ${process.env.COLLECT_API_KEY}`,
    },
  };
}

export const mockPrices = [
  { name: 'Alberta', currency: 'usd', gasoline: '1.61' },
  { name: 'British Columbia', currency: 'usd', gasoline: '2.10' },
  { name: 'Manitoba', currency: 'usd', gasoline: '1.79' },
  { name: 'New Brunswick', currency: 'usd', gasoline: '1.88' },
  {
    name: 'Newfoundland and Labrador',
    currency: 'usd',
    gasoline: '2.06',
  },
  { name: 'Nova Scotia', currency: 'usd', gasoline: '1.92' },
  { name: 'Ontario', currency: 'usd', gasoline: '1.95' },
  { name: 'Prince Edward Island', currency: 'usd', gasoline: '1.94' },
  { name: 'Quebec', currency: 'usd', gasoline: '2.00' },
  { name: 'Saskatchewan', currency: 'usd', gasoline: '1.78' },
];
