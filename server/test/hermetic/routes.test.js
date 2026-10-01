// Hermetic route + contract tests. Every outbound axios call is served from
// recorded fixtures (test/fixtures, re-record with `node test/fixtures/record.js`).
//
// The CONTRACT assertions pin the exact response field names the shipped mobile
// app parses (see app/src/screens/**). Changing any of them is a breaking change.

process.env.NODE_ENV = 'test';
process.env.CLIENT_API_KEY = 'test-client-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.RAPID_API_KEY = 'test-rapid-key-SECRET';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  create: () => require('../helpers/upstream').api,
}));

const { startServer, isolateEnv } = require('../helpers/server');
const app = require('../../src/index');
const {
  api: upstream, fixture, resetUpstream,
} = require('../helpers/upstream');

const request = startServer(app);
isolateEnv();
const get = (endpoint, query = {}) => request.get(endpoint).query({ api_key: 'test-client-key', ...query });
const keys = (obj) => Object.keys(obj).sort();
const lastUpstreamUrl = () => new URL(upstream.mock.calls.at(-1)[0].url);

let logSpy;
beforeEach(() => {
  resetUpstream();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

const DATA_ROUTES = [
  '/suggestions', '/place', '/geocode', '/distance', '/gas-prices', '/gas',
  '/years', '/makes', '/models', '/model-options', '/vehicle/41385',
];

describe('API key auth (api_key query param)', () => {
  it.each(DATA_ROUTES)('%s rejects a missing key with 401 { error }', async (route) => {
    const res = await request.get(route).query({ input: 'x', placeId: 'x', latlng: '1,2' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid API Key' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(DATA_ROUTES)('%s rejects a wrong key with 401', async (route) => {
    const res = await request.get(route).query({ api_key: 'nope', input: 'x', placeId: 'x', latlng: '1,2' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid API Key' });
  });
});

describe('GET /', () => {
  it('returns the banner', async () => {
    const res = await request.get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('GasMeUp API');
  });
});

describe('GET /suggestions', () => {
  it('CONTRACT: { suggestions: string[] }', async () => {
    const res = await get('/suggestions', { input: 'Toronto', session: 'sess-1', location: '43.65,-79.38' });
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(keys(res.body)).toEqual(['suggestions']);
    const expected = fixture('google.autocomplete').predictions.map((p) => p.description);
    expect(res.body.suggestions).toEqual(expected);
    expect(res.body.suggestions.every((s) => typeof s === 'string')).toBe(true);

    const { params } = upstream.mock.calls[0][0];
    expect(params).toMatchObject({
      input: 'Toronto', sessiontoken: 'sess-1', location: '43.65,-79.38', key: 'test-google-key',
    });
  });

  it('400 { error } when input is missing', async () => {
    const res = await get('/suggestions');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing input' });
  });

  it('500 { error } when Google returns a non-OK status', async () => {
    upstream.mockResolvedValueOnce({ data: { status: 'REQUEST_DENIED', predictions: [] } });
    const res = await get('/suggestions', { input: 'Toronto' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An error occurred' });
  });
});

describe('GET /place', () => {
  it('CONTRACT: bare JSON string (formatted address)', async () => {
    const res = await get('/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toBe(fixture('google.place').result.formatted_address);
    expect(upstream.mock.calls[0][0].params.placeid).toBe('ChIJpTvG15DL1IkRd8S0KlBVNTI');
  });

  it('400 { error } when placeId is missing', async () => {
    const res = await get('/place');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing placeId' });
  });
});

describe('GET /geocode', () => {
  it('CONTRACT: bare JSON string (formatted address)', async () => {
    const res = await get('/geocode', { latlng: '43.6532,-79.3832' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toBe(fixture('google.geocode').results[0].formatted_address);
  });

  it('400 { error } when latlng is missing', async () => {
    const res = await get('/geocode');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing latlng' });
  });
});

describe('GET /distance', () => {
  it('CONTRACT: { distance, start{lat,lng,address}, end{lat,lng,address}, data }', async () => {
    const res = await get('/distance', { start: 'Toronto', end: 'Montreal' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['data', 'distance', 'end', 'start']);
    expect(keys(res.body.start)).toEqual(['address', 'lat', 'lng']);
    expect(keys(res.body.end)).toEqual(['address', 'lat', 'lng']);

    const leg = fixture('google.directions').routes[0].legs[0];
    expect(res.body.distance).toBe(leg.distance.value / 1000);
    expect(res.body.start).toEqual({ ...leg.start_location, address: leg.start_address });
    expect(res.body.end).toEqual({ ...leg.end_location, address: leg.end_address });

    // The app walks data.routes[0].legs[0].steps[].start_location for map waypoints.
    const { steps } = res.body.data.routes[0].legs[0];
    expect(steps.length).toBeGreaterThan(0);
    steps.forEach((s) => expect(keys(s.start_location)).toEqual(['lat', 'lng']));
    expect(res.body.data).toEqual(fixture('google.directions'));
  });

  it('defaults to Ottawa -> Toronto when start/end are omitted', async () => {
    await get('/distance');
    const url = lastUpstreamUrl();
    expect(url.searchParams.get('origin')).toBe('Ottawa');
    expect(url.searchParams.get('destination')).toBe('Toronto');
  });

  it('404 { error } when Google finds no route', async () => {
    const res = await get('/distance', { start: 'Toronto', end: 'London, UK' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found (Toronto to London, UK)' });
  });

  it('404 { error } when a location is not found', async () => {
    upstream.mockResolvedValueOnce({ data: { status: 'NOT_FOUND', routes: [] } });
    const res = await get('/distance', { start: 'zzz', end: 'Toronto' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Location not found (zzz or Toronto)' });
  });

  it('500 { error } on an unknown Google status', async () => {
    upstream.mockResolvedValueOnce({ data: { status: 'OVER_QUERY_LIMIT', routes: [] } });
    const res = await get('/distance', { start: 'a', end: 'b' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An unknown error occurred (OVER_QUERY_LIMIT)' });
  });

  it('500 { error: string } on a network error (non-numeric cause is not used as a status)', async () => {
    const err = new Error('socket hang up', { cause: new Error('ECONNRESET') });
    upstream.mockRejectedValueOnce(err);
    const res = await get('/distance', { start: 'a', end: 'b' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'socket hang up' });
  });
});

describe('GET /gas-prices', () => {
  it('CONTRACT CA: { prices: [{ province, price, ... }] } (defaults to CA)', async () => {
    const res = await get('/gas-prices');
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['prices']);
    expect(res.body.prices).toEqual(fixture('gas.canada').prices);
    res.body.prices.forEach((p) => {
      expect(typeof p.province).toBe('string');
      expect(typeof p.price).toBe('number');
    });
    expect(lastUpstreamUrl().pathname).toBe('/canada');
    expect(upstream.mock.calls[0][0].headers['X-RapidAPI-Key']).toBe('test-rapid-key-SECRET');
  });

  it('CONTRACT CA + region: { prices } from /cities', async () => {
    const res = await get('/gas-prices', { country: 'CA', region: 'Ontario' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['prices']);
    expect(Array.isArray(res.body.prices)).toBe(true);
    expect(lastUpstreamUrl().pathname).toBe('/cities');
    expect(lastUpstreamUrl().searchParams.get('province')).toBe('Ontario');
  });

  it('CONTRACT US: { prices: [{ state, price }] }', async () => {
    const res = await get('/gas-prices', { country: 'US' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['prices']);
    res.body.prices.forEach((p) => expect(keys(p)).toEqual(['price', 'state']));
    expect(lastUpstreamUrl().pathname).toBe('/usa');
  });

  it('CONTRACT WORLD: { prices }', async () => {
    const res = await get('/gas-prices', { country: 'WORLD' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['prices']);
    expect(lastUpstreamUrl().pathname).toBe('/international');
  });

  it('400 { error } for a US region', async () => {
    const res = await get('/gas-prices', { country: 'US', region: 'Ohio' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Region is not supported for this country' });
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe('GET /gas', () => {
  it('CONTRACT CA: { price: number } (defaults to CA / Ontario)', async () => {
    const res = await get('/gas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ price: fixture('gas.province').price });
    expect(lastUpstreamUrl().pathname).toBe('/province');
    expect(lastUpstreamUrl().searchParams.get('province')).toBe('Ontario');
  });

  it('CONTRACT US: { price: number }', async () => {
    const res = await get('/gas', { country: 'US', region: 'OH' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ price: fixture('gas.state').price });
    expect(lastUpstreamUrl().pathname).toBe('/state');
  });

  it('500 { error: string } on upstream failure and never leaks upstream API keys', async () => {
    const res = await get('/gas', { country: 'US', region: 'Ohio' });
    expect(res.status).toBe(500);
    expect(keys(res.body)).toEqual(['error']);
    expect(res.body.error).toBe('Request failed with status code 400');
    expect(res.text).not.toContain('test-rapid-key-SECRET');
    // ...and not into logs either.
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('test-rapid-key-SECRET');
  });
});

describe('GET /years, /makes, /models', () => {
  it('CONTRACT /years: { years: string[] }', async () => {
    const res = await get('/years');
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['years']);
    expect(res.body.years).toEqual(fixture('fueleconomy.years').menuItem.map((m) => m.text));
  });

  it('CONTRACT /makes: { makes: string[] } (default year 2022)', async () => {
    const res = await get('/makes');
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['makes']);
    expect(res.body.makes).toEqual(fixture('fueleconomy.makes').menuItem.map((m) => m.text));
    expect(lastUpstreamUrl().searchParams.get('year')).toBe('2022');
  });

  it('CONTRACT /models: { models: string[] }', async () => {
    const res = await get('/models', { year: '2020', make: 'Honda' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['models']);
    expect(res.body.models).toEqual(fixture('fueleconomy.models').menuItem.map((m) => m.text));
    expect(lastUpstreamUrl().searchParams.get('make')).toBe('Honda');
  });

  it('500 { error: string } on upstream failure', async () => {
    upstream.mockRejectedValueOnce(new Error('boom'));
    const res = await get('/years');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});

describe('GET /model-options', () => {
  it('CONTRACT: { modelOptions: [{ text, value }] }', async () => {
    const res = await get('/model-options', { year: '2020', make: 'Honda', model: 'Civic 5Dr' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['modelOptions']);
    expect(res.body.modelOptions).toEqual(fixture('fueleconomy.options').menuItem);
    res.body.modelOptions.forEach((o) => expect(keys(o)).toEqual(['text', 'value']));
  });

  it('wraps a single upstream menuItem object into an array', async () => {
    const res = await get('/model-options', { year: '2020', make: 'Tesla', model: 'Model 3 Long Range AWD' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ modelOptions: [fixture('fueleconomy.options.single').menuItem] });
  });
});

describe('GET /vehicle/:vehicleId', () => {
  it('CONTRACT: { mpg, city, highway, fuelType }', async () => {
    const res = await get('/vehicle/41385');
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['city', 'fuelType', 'highway', 'mpg']);
    const v = fixture('fueleconomy.vehicle');
    expect(res.body).toEqual({
      mpg: Number(v.comb08), city: Number(v.city08), highway: Number(v.highway08), fuelType: v.fuelType,
    });
    expect(lastUpstreamUrl().pathname).toBe('/ws/rest/vehicle/41385');
  });
});

describe('Express 5 behaviour', () => {
  it('repeated query params still fail API key validation (array != string)', async () => {
    const res = await request.get('/years?api_key=test-client-key&api_key=test-client-key');
    expect(res.status).toBe(401);
  });

  it('unknown routes still 404', async () => {
    const res = await request.get('/nope');
    expect(res.status).toBe(404);
  });
});
