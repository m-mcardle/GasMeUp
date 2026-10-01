const dotenv = require('dotenv');
const express = require('express');

const axios = require('axios');

const {
  LocationAutocomplete,
  Directions,
  Place,
  Geocode,
  mapsApiMode,
  parseLatLng,
  PlacesAutocompleteNew,
  PlaceDetailsNew,
  ForwardGeocode,
  ComputeRoutes,
} = require('./queries/google');
const { toLegacyDirections, toLegacySuggestions } = require('./adapters/google');
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

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3001;

const app = express();
const api = axios.create();

/*
Error helpers
*/
// Express 5 throws on non-integer / out-of-range status codes, and axios errors
// can carry a non-numeric `cause`, so only trust integer HTTP status causes.
function errorStatus(err) {
  const status = err?.cause;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

// Never serialize the raw Error: AxiosError#toJSON includes the request config,
// which contains upstream API keys (e.g. X-RapidAPI-Key).
function errorMessage(err) {
  return err?.message ?? 'An error occurred';
}

/*
Axios Request Functions (to external APIs)
*/
const routeNotFound = (start, end) => Error(`Route not found (${start} to ${end})`, { cause: 404 });
const locationNotFound = (start, end) => Error(`Location not found (${start} or ${end})`, { cause: 404 });
function unknownGoogleError(status) {
  LogError(`An unknown error occurred (${status})`);
  return Error(`An unknown error occurred (${status})`, { cause: 500 });
}

// New-API HTTP errors (403 PERMISSION_DENIED, 429 RESOURCE_EXHAUSTED, ...) are
// reported like the legacy APIs' non-OK `status` values; network errors pass through.
async function callNewApi(config) {
  try {
    return await api(config);
  } catch (err) {
    const status = err?.response?.data?.error?.status ?? err?.response?.data?.[0]?.error?.status;
    if (status) throw unknownGoogleError(status);
    throw err;
  }
}

async function GetDirectionsLegacy(startLocation, endLocation) {
  const { data } = await api(Directions(startLocation, endLocation));
  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') throw routeNotFound(startLocation, endLocation);
    if (data.status === 'NOT_FOUND') throw locationNotFound(startLocation, endLocation);
    throw unknownGoogleError(data.status);
  }
  return data;
}

// Resolves free text (or "lat,lng") to { address, placeId, types, waypoint } the
// way legacy Directions geocoded its origin/destination. null = not found.
async function ResolveWaypoint(text) {
  const latLng = parseLatLng(text);
  const { data } = await api(latLng ? Geocode(text) : ForwardGeocode(text));
  if (data.status === 'ZERO_RESULTS' || data.status === 'NOT_FOUND') return null;
  if (data.status !== 'OK' || !data.results?.length) throw unknownGoogleError(data.status);

  const [result] = data.results;
  return {
    address: result.formatted_address,
    placeId: result.place_id,
    types: result.types,
    waypoint: latLng ? { location: { latLng } } : { placeId: result.place_id },
  };
}

// Routes API path: geocode both ends, computeRoutes, then rebuild the legacy
// Directions payload so /distance returns byte-for-byte the same shape.
async function GetDirectionsNew(startLocation, endLocation) {
  const [origin, destination] = await Promise.all([
    ResolveWaypoint(startLocation),
    ResolveWaypoint(endLocation),
  ]);
  if (!origin || !destination) throw locationNotFound(startLocation, endLocation);

  const { data: routesData } = await callNewApi(ComputeRoutes(origin.waypoint, destination.waypoint));
  // computeRoutes answers an unroutable pair with an empty object.
  if (!routesData?.routes?.length) throw routeNotFound(startLocation, endLocation);

  return toLegacyDirections(routesData, origin, destination);
}

async function GetDistanceV2(startLocation, endLocation) {
  const data = mapsApiMode() === 'new'
    ? await GetDirectionsNew(startLocation, endLocation)
    : await GetDirectionsLegacy(startLocation, endLocation);

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
  if (mapsApiMode() === 'new') {
    const { data } = await callNewApi(PlaceDetailsNew(placeId));
    if (typeof data?.formattedAddress !== 'string') {
      throw Error('Invalid Request to Google (missing formattedAddress)');
    }
    return data.formattedAddress;
  }

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
  if (mapsApiMode() === 'new') {
    const { data } = await callNewApi(PlacesAutocompleteNew(input, sessionId, location));
    const suggestions = toLegacySuggestions(data);
    // Legacy answers "no matches" with status ZERO_RESULTS, which this route has
    // always surfaced as a 500; keep that status code for the shipped app.
    if (!suggestions.length) throw Error('Invalid Request to Google (ZERO_RESULTS)');
    return suggestions;
  }

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
    res.status(errorStatus(exception)).send({ error: exception.message });
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
    res.status(errorStatus(exception)).send({ error: exception.message });
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
    res.status(500).send({ error: errorMessage(exception) });
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
    res.status(500).send({ error: errorMessage(exception) });
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
    res.status(500).send({ error: errorMessage(exception) });
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
    res.status(500).send({ error: errorMessage(exception) });
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
    res.status(500).send({ error: errorMessage(exception) });
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
    Log(`[vehicle] Vehicle: ${JSON.stringify({ comb08, city08, highway08, fuelType })}`);
    res.json({ mpg: Number(comb08), city: Number(city08), highway: Number(highway08), fuelType });
  } catch (exception) {
    LogError(exception);
    res.status(500).send({ error: errorMessage(exception) });
  }
});

app.get('/', (req, res) => {
  res.send('GasMeUp API');
});

// Express 5 forwards rejected async handlers here; respond with JSON, not HTML.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  LogError(err);
  res.status(errorStatus(err)).send({ error: 'An error occurred' });
});

if (process.env.NODE_ENV !== 'test') {
  // Express 5 passes listen errors (e.g. EADDRINUSE) to this callback.
  app.listen(PORT, (err) => {
    if (err) throw err;
    Log(`Server listening on ${PORT}`);
  });
}

module.exports = app;
