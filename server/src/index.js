const dotenv = require('dotenv');
const express = require('express');

const axios = require('axios');
const pkg = require('axios-cache-adapter');

const {
  LocationAutocomplete,
  Directions,
  mockLocations,
} = require('./queries/google');
const {
  CanadianGasPriceRequest, AmericanGasPriceRequest, CanadianGasPricesRequest,
} = require('./queries/gasprice');

const { GasCostForDistance } = require('./calculations/fuel');

const { Log, LogError } = require('./utils/console');
const { validateAPIKey } = require('./utils/validation');

dotenv.config();

const PORT = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';

Log('Google Enabled:', process.env.ENABLE_GOOGLE_QUERIES);

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

async function GetDistanceV2(startLocation, endLocation) {
  if (useGoogleAPI) {
    const response = await api(Directions(startLocation, endLocation));

    const { data } = response;
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        throw Error('Route not found', { cause: 404 });
      } else if (data.status === 'NOT_FOUND') {
        throw Error('Location not found', { cause: 404 });
      } else {
        throw Error(`An unknown error occurred (${data.status})`, { cause: 500 });
      }
    }

    const route = data.routes[0].legs[0];
    const distance = route.distance.value / 1000;
    const end = {
      ...route.end_location,
      address: route.end_address,
    };
    const start = {
      ...route.start_location,
      address: route.start_address,
    };

    return {
      distance,
      end,
      start,
      data,
    };
  }

  return {
    distance: 10,
    end: {
      lat: 43.6532,
      lng: -79.3832,
    },
    start: {
      lat: 43.6532,
      lng: -79.3832,
    },
  };
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

async function GetGasPrice(country, region) {
  if (region) {
    const { data } = await api(country === 'US' ? AmericanGasPriceRequest(region) : CanadianGasPriceRequest(region));
    const { price } = data;
    return price;
  }

  if (country === 'US') {
    throw Error('US Gas Prices are not supported yet', { cause: 400 });
  }
  const { data } = await api(CanadianGasPricesRequest());
  const { prices } = data;
  return prices;
}

/*
Express API Endpoints
*/

// Handle GET requests for total gas cost for a trip
app.get('/trip-cost', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

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
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const input = req.query?.input ?? 'Toronto';
  const sessionId = req.query?.session;
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const suggestions = await GetSuggestions(input, sessionId);

    Log(`[suggestions] ${suggestions.length} suggestions for ${input}`);
    res.json({ suggestions });
  } catch (err) {
    LogError(err);
    res.status(500).send({ error: 'An error occurred' });
  }
});

// Handle request for distances
app.get('/distance', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ?? 'Toronto';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const {
      distance, start, end, data,
    } = await GetDistanceV2(startLocation, endLocation);

    Log(`[distance] Distance: ${distance}km`);
    Log(`[distance] Start: ${start.lat}/${start.lng},\tEnd: ${end.lat}/${end.lng}`);
    res.json({
      distance, start, end, data,
    });
  } catch (exception) {
    LogError(exception);
    res.status(exception.cause ?? 500).send({ error: exception.message });
  }
});

// Handle GET requests to /gas-price route, provide list of gas prices of all provinces in Canada
app.get('/gas-prices', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }
  const country = req.query?.country ?? 'CA';
  Log(`[gas-prices] Requested gas prices for ${country}`);

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const gasPrices = await GetGasPrice(country);
    res.json({ prices: gasPrices });
  } catch (exception) {
    LogError(exception);
    res.status(exception.cause ?? 500).send({ error: exception.message });
  }
});

app.get('/gas', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const country = req.query?.country ?? 'CA';
  const region = req.query?.region ?? 'Ontario';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const gasPrice = await GetGasPrice(country, region);
    Log(`[gas] Gas Price: $${gasPrice}`);
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
