const dotenv = require('dotenv');
const express = require('express');

const localtunnel = require('localtunnel');

const axios = require('axios');
const pkg = require('axios-cache-adapter');

const {
  LocationAutocomplete,
  Directions,
  mockLocations,
} = require('./queries/google');
const { GasPriceRequest, GasPricesRequest } = require('./queries/gasprice');

const { GasCostForDistance } = require('./calculations/fuel');

const { Log, LogError } = require('./utils/console');

dotenv.config();

const PORT = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';

Log('Start Tunnel:', process.env.START_TUNNEL);
Log('Google Enabled:', process.env.ENABLE_GOOGLE_QUERIES);

if (process.env.START_TUNNEL === 'true' && env !== 'test') {
  let tunnel;
  (async () => {
    tunnel = await localtunnel({ port: 3001, subdomain: 'carpoolcalc' });

    Log('Localtunnel at:', tunnel.url);
    tunnel.on('close', () => {
      // tunnels are closed
    });
  })();
}

const useGoogleAPI = (process.env.ENABLE_GOOGLE_QUERIES === 'true' || env === 'production');

const { setupCache } = pkg;

const app = express();

const cache = setupCache({
  maxAge: 24 * 60 * 60 * 1000,
  exclude: {
    // Store responses from requests with query parameters in cache
    query: false,
  },
});

const api = axios.create({
  adapter: cache.adapter,
});

/*
Axios Request Functions (to Google and CollectAPI)
*/
async function GetDistance(startLocation, endLocation) {
  if (useGoogleAPI) {
    const response = await api(Directions(startLocation, endLocation));

    const { data } = response;
    if (data.status !== 'OK') {
      throw Error(`Invalid Request to Google (${data.status})`);
    }
    const distance = data.routes[0].legs[0].distance.value / 1000;
    return distance;
  }

  return 10;
}

async function GetSuggestions(input, sessionId) {
  if (useGoogleAPI) {
    const response = await api(LocationAutocomplete(input, sessionId));

    const { data } = response;
    if (data.status !== 'OK') {
      throw Error(`Invalid Request to Google (${data.status})`);
    }
    const { predictions } = data;

    const suggestions = predictions.map((el) => el.description);
    return suggestions;
  }

  return mockLocations.predictions.map((el) => el.description);
}

async function GetGasPrice(province) {
  if (province) {
    const { data } = await api(GasPriceRequest(province));
    const { price } = data;
    return price;
  }

  const { data } = await api(GasPricesRequest());
  const { prices } = data;
  return prices;
}

/*
Express API Endpoints
*/

// Handle GET requests for total gas cost for a trip
app.get('/trip-cost', async (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ?? 'Toronto';
  const manualGasPrice = req.query?.price ?? '';
  const province = 'Ontario'; // TODO - This should end up being determined by the user's location

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const [distance, gasPrice] = manualGasPrice
      ? [await GetDistance(startLocation, endLocation), Number(manualGasPrice)]
      : await Promise.all([
        GetDistance(startLocation, endLocation),
        GetGasPrice(province),
      ]);
    Log(`[trip-cost] Distance: ${distance}km and Gas Price: $${gasPrice}`);

    const cost = GasCostForDistance(distance, gasPrice);
    res.json({ cost, distance, gasPrice });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

// Handle autocomplete suggestions for locations
app.get('/suggestions', async (req, res) => {
  const input = req.query?.input ?? 'Toronto';
  const sessionId = req.query?.session;
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const suggestions = await GetSuggestions(input, sessionId);
    res.json({ suggestions });
  } catch (err) {
    LogError(err);
    res.status(500).send({ error: 'An error occurred' });
  }
});

// Handle request for distances
app.get('/distance', async (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ?? 'Toronto';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const distance = await GetDistance(startLocation, endLocation);
    res.json({ distance });
  } catch (exception) {
    res.status(500).send({ error: exception });
  }
});

// Handle GET requests to /gas-price route, provide list of gas prices of all provinces in Canada
app.get('/gas-prices', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const gasPrices = await GetGasPrice();
    res.json({ prices: gasPrices });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/gas', async (req, res) => {
  const province = req.query?.province ?? 'Ontario';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const gasPrice = await GetGasPrice(province);
    res.json({ price: gasPrice });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    Log(`Server listening on ${PORT}`);
  });
}

module.exports = app;
