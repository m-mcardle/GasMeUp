// ExchangeRate-API (v6). The key travels in the Authorization header so it never
// appears in a URL. Rates update once a day upstream, so callers cache results.
const ExchangeRatePairRequest = (from, to) => ({
  method: 'GET',
  url: `https://v6.exchangerate-api.com/v6/pair/${from}/${to}`,
  headers: {
    Authorization: `Bearer ${process.env.EXCHANGE_RATE_API_KEY}`,
  },
  timeout: 10000,
});

module.exports = {
  ExchangeRatePairRequest,
};
