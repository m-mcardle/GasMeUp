const url = 'https://canadian-gas-prices.p.rapidapi.com';

function CanadianGasPriceRequest(province) {
  return {
    method: 'get',
    url: encodeURI(`${url}/cities?province=${province}`),
    headers: {
      'X-RapidAPI-Host': 'canadian-gas-prices.p.rapidapi.com',
      'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
    },
  };
}

function AmericanGasPriceRequest(state) {
  return {
    method: 'get',
    url: encodeURI(`${url}/state?state=${state}`),
    headers: {
      'X-RapidAPI-Host': 'canadian-gas-prices.p.rapidapi.com',
      'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
    },
  };
}

function CanadianGasPricesRequest() {
  return {
    method: 'get',
    url: encodeURI(`${url}/canada`),
    headers: {
      'X-RapidAPI-Host': 'canadian-gas-prices.p.rapidapi.com',
      'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
    },
  };
}

function AmericanGasPricesRequest() {
  return {
    method: 'get',
    url: encodeURI(`${url}/usa`),
    headers: {
      'X-RapidAPI-Host': 'canadian-gas-prices.p.rapidapi.com',
      'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
    },
  };
}

function WorldGasPricesRequest() {
  return {
    method: 'get',
    url: encodeURI(`${url}/international`),
    headers: {
      'X-RapidAPI-Host': 'canadian-gas-prices.p.rapidapi.com',
      'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
    },
  };
}

module.exports = {
  CanadianGasPriceRequest,
  AmericanGasPriceRequest,
  CanadianGasPricesRequest,
  AmericanGasPricesRequest,
  WorldGasPricesRequest,
};
