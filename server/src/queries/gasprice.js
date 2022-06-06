const url = 'https://sd2mauom15.execute-api.us-east-1.amazonaws.com/dev/api';

function GasPriceRequest(province) {
  return {
    method: 'get',
    url: encodeURI(`${url}/price?province=${province}`),
  };
}

function GasPricesRequest() {
  return {
    method: 'get',
    url: encodeURI(`${url}/prices`),
  };
}

module.exports = { GasPriceRequest, GasPricesRequest };
