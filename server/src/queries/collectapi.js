function GasPrices(location = 'canada') {
  return {
    method: 'get',
    url: `https://api.collectapi.com/gasPrice/${location}`,
    headers: {
      'content-type': 'application/json',
      authorization: `apikey ${process.env.COLLECT_API_KEY}`,
    },
  };
}

const mockPrices = [
  { name: 'Alberta', currency: 'usd', gasoline: '1.70' },
  { name: 'British Columbia', currency: 'usd', gasoline: '2.23' },
  { name: 'Manitoba', currency: 'usd', gasoline: '1.87' },
  { name: 'New Brunswick', currency: 'usd', gasoline: '1.99' },
  {
    name: 'Newfoundland and Labrador',
    currency: 'usd',
    gasoline: '2.17',
  },
  { name: 'Nova Scotia', currency: 'usd', gasoline: '2.05' },
  { name: 'Ontario', currency: 'usd', gasoline: '2.05' },
  { name: 'Prince Edward Island', currency: 'usd', gasoline: '2.06' },
  { name: 'Quebec', currency: 'usd', gasoline: '2.13' },
  { name: 'Saskatchewan', currency: 'usd', gasoline: '1.87' },
];

module.exports = { GasPrices, mockPrices };
