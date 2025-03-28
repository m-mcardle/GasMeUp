const dotenv = require('dotenv');
const express = require('express');

const axios = require('axios');
const pkg = require('axios-cache-adapter');

const {
  LocationAutocomplete,
  Directions,
  Place,
  Geocode,
  mockLocations,
} = require('./queries/google');
const {
  CanadianGasPriceRequest,
  AmericanGasPriceRequest,
  ProvincialGasPricesRequest,
  CanadianGasPricesRequest,
  AmericanGasPricesRequest,
  WorldGasPricesRequest,
} = require('./queries/gasprice');
const {
  YearRequest,
  MakeRequest,
  ModelRequest,
  ModelOptionRequest,
  VehicleRequest
} = require('./queries/fueleconomy');

const { Log, LogError } = require('./utils/console');
const { validateAPIKey } = require('./utils/validation');

dotenv.config();

const PORT = process.env.PORT || 3001;

const { setupCache } = pkg;

const app = express();

const cache = setupCache({
  maxAge: 1, // 5 * 60 * 1000, // 5 minutes
  exclude: {
    // Store responses from requests with query parameters in cache
    query: false,
  },
});

const api = axios.create({
  adapter: cache.adapter,
});

/*
Axios Request Functions (to external APIs)
*/
async function GetDistanceV2(startLocation, endLocation) {
  const response = await api(Directions(startLocation, endLocation));

  const { data } = response;
  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') {
      throw Error(`Route not found (${startLocation} to ${endLocation})`, { cause: 404 });
    } else if (data.status === 'NOT_FOUND') {
      throw Error(`Location not found (${startLocation} or ${endLocation})`, { cause: 404 });
    } else {
      LogError(`An unknown error occurred (${data.status})`);
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

async function GetPlace(placeId) {
  const response = await api(Place(placeId));

  const { data } = response;
  if (data.status !== 'OK') {
    throw Error(`Invalid Request to Google (${data.status})`);
  }

  const address = data.result.formatted_address;
  return address;
}

async function ReverseGeocode(latlng) {
  const response = await api(Geocode(latlng));

  const { data } = response;
  if (data.status !== 'OK') {
    throw Error(`Invalid Request to Google (${data.status})`);
  }

  const address = data.results[0].formatted_address;
  return address;
}

async function GetSuggestions(input, sessionId, location) {
  const response = await api(LocationAutocomplete(input, sessionId, location));

  const { data } = response;
  if (data.status !== 'OK') {
    throw Error(`Invalid Request to Google (${data.status})`);
  }
  const { predictions } = data;

  const suggestions = predictions.map((el) => el.description);
  return suggestions;
}

async function GetGasPrice(country, region) {
  const { data } = await api(country === 'US' ? AmericanGasPriceRequest(region) : CanadianGasPriceRequest(region));
  const { price } = data;
  return price;
}

async function GetGasPrices(country, region) {
  if (country === 'WORLD') {
    const { data } = await api(WorldGasPricesRequest());
    const { prices } = data;
    return prices;
  }

  if (country === 'CA') {
    if (region) {
      const { data } = await api(ProvincialGasPricesRequest(region));
      const { prices } = data;
      return prices;
    }

    const { data } = await api(CanadianGasPricesRequest());
    const { prices } = data;
    return prices;
  }

  if (region) {
    throw Error('Region is not supported for this country', { cause: 400 });
  }

  const { data } = await api(AmericanGasPricesRequest());
  const { prices } = data;
  return prices;
}

async function GetYears() {
  const { data } = await api(YearRequest());
  const { menuItem } = data;

  const yearObjects = menuItem.length ? menuItem : [menuItem];
  const years = yearObjects.map((el) => el.text);
  return years;
}

async function GetMakes(year) {
  const { data } = await api(MakeRequest(year));
  const { menuItem } = data;

  const makeObjects = menuItem.length ? menuItem : [menuItem];
  const makes = makeObjects.map((el) => el.text);
  return makes;
}

async function GetModels(year, make) {
  const { data } = await api(ModelRequest(year, make));
  const { menuItem } = data;

  const modelObjects = menuItem.length ? menuItem : [menuItem];
  const models = modelObjects.map((el) => el.text);
  return models;
}

async function GetModelOptions(year, make, model) {
  const { data } = await api(ModelOptionRequest(year, make, model));
  const { menuItem } = data;

  const modelOptionObjects = menuItem.length ? menuItem : [menuItem];
  return modelOptionObjects;
}

async function GetVehicle(id) {
  const { data } = await api(VehicleRequest(id));
  return data;
}


/*
Express API Endpoints
*/

// Handle autocomplete suggestions for locations
app.get('/suggestions', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const input = req.query?.input;
  if (!input) {
    res.status(400).send({ error: 'Missing input' });
    return;
  }

  const sessionId = req.query?.session;
  const location = req.query?.location;

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const suggestions = await GetSuggestions(input, sessionId, location);

    Log(`[suggestions] ${suggestions.length} suggestions for ${input} \t (session: ${sessionId}, location: ${location})`);
    res.json({ suggestions });
  } catch (err) {
    LogError(err);
    res.status(500).send({ error: 'An error occurred' });
  }
});

// Handle request for place details
app.get('/place', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const placeId = req.query?.placeId;
  if (!placeId) {
    res.status(400).send({ error: 'Missing placeId' });
    return;
  }

  res.set('Access-Control-Allow-Origin', '*');

  try {
    const place = await GetPlace(placeId);
    Log(`[place] ${JSON.stringify(place)} (${placeId})`);
    res.json(place);
  } catch (err) {
    LogError(err);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.get('/geocode', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const latlng = req.query?.latlng;
  if (!latlng) {
    res.status(400).send({ error: 'Missing latlng' });
    return;
  }

  res.set('Access-Control-Allow-Origin', '*');

  try {
    const address = await ReverseGeocode(latlng);
    Log(`[geocode] ${address}`);
    res.json(address);
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

  const startLocation = req.query?.start ?? 'Ottawa';
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

// Handle GET requests to /gas-price route
// provides list of gas prices of all provinces in Canada or all cities in a province
app.get('/gas-prices', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }
  const country = req.query?.country ?? 'CA';
  const region = req.query?.region;
  Log(`[gas-prices] Requested gas prices for ${country} / ${region}`);

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const gasPrices = await GetGasPrices(country, region);
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

app.get('/years', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const years = await GetYears();
    Log(`[years] Years: ${JSON.stringify(years)}`);
    res.json({ years });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/makes', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const year = req.query?.year ?? '2022';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const makes = await GetMakes(year);
    Log(`[makes] Makes: ${makes}`);
    res.json({ makes });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/models', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const year = req.query?.year ?? '2022';
  const make = req.query?.make ?? 'Honda';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const models = await GetModels(year, make);
    Log(`[models] Models: ${JSON.stringify(models)}`);
    res.json({ models });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/model-options', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const year = req.query?.year ?? '2022';
  const make = req.query?.make ?? 'Honda';
  const model = req.query?.model ?? 'Civic 5dr';
  
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const modelOptions = await GetModelOptions(year, make, model);
    Log(`[model-options] ModelOptions: ${JSON.stringify(modelOptions)}`);
    res.json({ modelOptions });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/vehicle/:vehicleId', async (req, res) => {
  if (!validateAPIKey(req.query?.api_key)) {
    res.status(401).send({ error: 'Invalid API Key' });
    return;
  }

  const id = req.params?.vehicleId ?? '41385';

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { comb08, city08, highway08, fuelType } = await GetVehicle(id);
    Log(`[vehicle] Vehicle: ${comb08, city08, highway08, fuelType}`);
    res.json({ mpg: Number(comb08), city: Number(city08), highway: Number(highway08), fuelType });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: exception });
  }
});

app.get('/', (req, res) => {
  res.send('GasMeUp API');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    Log(`Server listening on ${PORT}`);
  });
}

module.exports = app;
