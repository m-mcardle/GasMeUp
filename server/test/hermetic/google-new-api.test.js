// The Google-backed route CONTRACT assertions from routes.test.js, re-run with
// GOOGLE_MAPS_API=new (Places API (New) + Routes API). The mobile app must not be
// able to tell which mode served a response, so every assertion here mirrors one
// in routes.test.js, plus legacy-vs-new parity checks on the same trip.
//
// The google.places_new.* / google.routes* fixtures were built from the legacy
// recordings in the documented v1/v2 shapes; re-record with
// `node test/fixtures/record.js places_new google.routes` once the APIs are enabled.

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
  api: upstream, httpError, fixture, resetUpstream,
} = require('../helpers/upstream');
const { ROUTES_FIELD_MASK } = require('../../src/queries/google');

const request = startServer(app);
isolateEnv();
const get = (endpoint, query = {}) => request.get(endpoint).query({ api_key: 'test-client-key', ...query });
const keys = (obj) => Object.keys(obj).sort();
const calls = () => upstream.mock.calls.map(([config]) => config);
const callTo = (substr) => calls().find((c) => c.url.includes(substr));

let logSpy;
beforeEach(() => {
  process.env.GOOGLE_MAPS_API = 'new';
  resetUpstream();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

const GOOGLE_ROUTES = ['/suggestions', '/place', '/geocode', '/distance'];

describe('new mode: API key auth', () => {
  it.each(GOOGLE_ROUTES)('%s rejects a missing key with 401 { error }', async (route) => {
    const res = await request.get(route).query({ input: 'x', placeId: 'x', latlng: '1,2' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid API Key' });
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe('new mode: never puts the Google key in a URL', () => {
  it.each([
    ['/suggestions', { input: 'Toronto', session: 'sess-1' }, 'places:autocomplete'],
    ['/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' }, '/v1/places/'],
    ['/distance', { start: 'Toronto', end: 'Montreal' }, 'computeRoutes'],
  ])('%s sends X-Goog-Api-Key + X-Goog-FieldMask headers', async (route, query, target) => {
    await get(route, query);
    const config = callTo(target);
    expect(config.headers['X-Goog-Api-Key']).toBe('test-google-key');
    expect(config.headers['X-Goog-FieldMask']).toEqual(expect.any(String));
    expect(config.url).not.toContain('test-google-key');
    expect(config.params).toBeUndefined();
  });
});

describe('new mode: GET /suggestions', () => {
  it('CONTRACT: { suggestions: string[] }', async () => {
    const res = await get('/suggestions', { input: 'Toronto', session: 'sess-1', location: '43.65,-79.38' });
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(keys(res.body)).toEqual(['suggestions']);
    const expected = fixture('google.places_new.autocomplete').suggestions.map((s) => s.placePrediction.text.text);
    expect(res.body.suggestions).toEqual(expected);
    expect(res.body.suggestions.every((s) => typeof s === 'string')).toBe(true);

    const config = callTo('places:autocomplete');
    expect(config.method).toBe('post');
    expect(config.headers['X-Goog-FieldMask']).toBe('suggestions.placePrediction.text.text');
    expect(config.data).toEqual({
      input: 'Toronto',
      sessionToken: 'sess-1',
      locationBias: { circle: { center: { latitude: 43.65, longitude: -79.38 }, radius: 40000 } },
    });
  });

  it('returns the same suggestions as legacy mode for the same query', async () => {
    const fresh = await get('/suggestions', { input: 'Toronto' });
    process.env.GOOGLE_MAPS_API = 'legacy';
    const legacy = await get('/suggestions', { input: 'Toronto' });
    expect(fresh.body).toEqual(legacy.body);
  });

  it('passes a UUID session token through and drops invalid tokens / locations', async () => {
    await get('/suggestions', { input: 'Toronto', session: 'b2f0c6c4-1f7e-4c1e-9d55-3f1e6f2b8a10' });
    expect(callTo('places:autocomplete').data.sessionToken).toBe('b2f0c6c4-1f7e-4c1e-9d55-3f1e6f2b8a10');

    upstream.mockClear();
    await get('/suggestions', { input: 'Toronto', session: 'not a valid token!', location: 'somewhere' });
    expect(callTo('places:autocomplete').data).toEqual({ input: 'Toronto' });
  });

  it('400 { error } when input is missing', async () => {
    const res = await get('/suggestions');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing input' });
  });

  it('500 { error } when Google rejects the request (e.g. API not enabled)', async () => {
    upstream.mockImplementationOnce(async (config) => {
      throw httpError(config, 403, { error: { code: 403, status: 'PERMISSION_DENIED' } });
    });
    const res = await get('/suggestions', { input: 'Toronto' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An error occurred' });
  });

  it('500 { error } when there are no predictions (legacy ZERO_RESULTS behaviour)', async () => {
    upstream.mockResolvedValueOnce({ data: {} });
    const res = await get('/suggestions', { input: 'qqqqzzzz' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An error occurred' });
  });
});

describe('new mode: GET /place', () => {
  it('CONTRACT: bare JSON string (formatted address)', async () => {
    const res = await get('/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toBe(fixture('google.places_new.place').formattedAddress);

    const config = callTo('/v1/places/');
    expect(new URL(config.url).pathname).toBe('/v1/places/ChIJpTvG15DL1IkRd8S0KlBVNTI');
    expect(config.headers['X-Goog-FieldMask']).toBe('formattedAddress');
  });

  it('matches legacy mode for the same place', async () => {
    const fresh = await get('/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' });
    process.env.GOOGLE_MAPS_API = 'legacy';
    const legacy = await get('/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' });
    expect(fresh.body).toEqual(legacy.body);
  });

  it('400 { error } when placeId is missing', async () => {
    const res = await get('/place');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing placeId' });
  });

  it('500 { error } when Google returns an error', async () => {
    upstream.mockImplementationOnce(async (config) => {
      throw httpError(config, 404, { error: { code: 404, status: 'NOT_FOUND' } });
    });
    const res = await get('/place', { placeId: 'bogus' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An error occurred' });
  });
});

describe('new mode: GET /geocode (Geocoding API is not legacy; unchanged)', () => {
  it('CONTRACT: bare JSON string (formatted address)', async () => {
    const res = await get('/geocode', { latlng: '43.6532,-79.3832' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toBe(fixture('google.geocode').results[0].formatted_address);
  });
});

describe('new mode: GET /distance', () => {
  it('CONTRACT: { distance, start{lat,lng,address}, end{lat,lng,address}, data }', async () => {
    const res = await get('/distance', { start: 'Toronto', end: 'Montreal' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['data', 'distance', 'end', 'start']);
    expect(keys(res.body.start)).toEqual(['address', 'lat', 'lng']);
    expect(keys(res.body.end)).toEqual(['address', 'lat', 'lng']);

    const leg = fixture('google.routes').routes[0].legs[0];
    expect(res.body.distance).toBe(leg.distanceMeters / 1000);
    expect(res.body.start).toEqual({
      lat: leg.startLocation.latLng.latitude,
      lng: leg.startLocation.latLng.longitude,
      address: fixture('google.geocode.forward.toronto').results[0].formatted_address,
    });
    expect(res.body.end).toEqual({
      lat: leg.endLocation.latLng.latitude,
      lng: leg.endLocation.latLng.longitude,
      address: fixture('google.geocode.forward.montreal').results[0].formatted_address,
    });

    // The app walks data.routes[0].legs[0].steps[].start_location for map waypoints.
    const { steps } = res.body.data.routes[0].legs[0];
    expect(steps.length).toBe(leg.steps.length);
    steps.forEach((s) => expect(keys(s.start_location)).toEqual(['lat', 'lng']));
  });

  it('rebuilds `data` with the legacy Directions keys at every level', async () => {
    const res = await get('/distance', { start: 'Toronto', end: 'Montreal' });
    const legacy = fixture('google.directions');
    const { data } = res.body;
    expect(keys(data)).toEqual(keys(legacy));
    expect(data.status).toBe('OK');
    expect(keys(data.routes[0])).toEqual(keys(legacy.routes[0]));
    expect(keys(data.routes[0].legs[0])).toEqual(keys(legacy.routes[0].legs[0]));
    data.routes[0].legs[0].steps.forEach((step, i) => {
      expect(keys(step)).toEqual(keys(legacy.routes[0].legs[0].steps[i]));
    });
    data.geocoded_waypoints.forEach((wp, i) => {
      expect(keys(wp)).toEqual(keys(legacy.geocoded_waypoints[i]));
    });
  });

  it('is value-identical to legacy mode for the same trip (except copyrights / instruction markup)', async () => {
    const fresh = (await get('/distance', { start: 'Toronto', end: 'Montreal' })).body;
    process.env.GOOGLE_MAPS_API = 'legacy';
    const legacy = (await get('/distance', { start: 'Toronto', end: 'Montreal' })).body;

    expect(fresh.distance).toBe(legacy.distance);
    expect(fresh.start).toEqual(legacy.start);
    expect(fresh.end).toEqual(legacy.end);

    const strip = (d) => ({
      ...d,
      routes: d.routes.map(({ copyrights, ...r }) => ({
        ...r,
        legs: r.legs.map((l) => ({ ...l, steps: l.steps.map(({ html_instructions, ...s }) => s) })),
      })),
    });
    expect(strip(fresh.data)).toEqual(strip(legacy.data));
  });

  it('geocodes both ends, then routes between their place IDs with a field mask', async () => {
    await get('/distance', { start: 'Toronto', end: 'Montreal' });
    const geocodes = calls().filter((c) => c.url.endsWith('/geocode/json'));
    expect(geocodes.map((c) => c.params.address)).toEqual(['Toronto', 'Montreal']);

    const routes = callTo('computeRoutes');
    expect(routes.method).toBe('post');
    expect(routes.headers['X-Goog-FieldMask']).toBe(ROUTES_FIELD_MASK);
    expect(routes.data).toEqual({
      origin: { placeId: fixture('google.geocode.forward.toronto').results[0].place_id },
      destination: { placeId: fixture('google.geocode.forward.montreal').results[0].place_id },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineEncoding: 'ENCODED_POLYLINE',
    });
  });

  it('routes from coordinates when start is "lat,lng" (reverse geocoded for the address)', async () => {
    const res = await get('/distance', { start: '43.6532,-79.3832', end: 'Montreal' });
    expect(res.status).toBe(200);
    expect(res.body.start.address).toBe(fixture('google.geocode').results[0].formatted_address);
    expect(callTo('computeRoutes').data.origin).toEqual({
      location: { latLng: { latitude: 43.6532, longitude: -79.3832 } },
    });
  });

  it('defaults to Ottawa -> Toronto when start/end are omitted', async () => {
    await get('/distance');
    const geocodes = calls().filter((c) => c.url.endsWith('/geocode/json'));
    expect(geocodes.map((c) => c.params.address)).toEqual(['Ottawa', 'Toronto']);
  });

  it('404 { error } when Google finds no route', async () => {
    const res = await get('/distance', { start: 'Toronto', end: 'London, UK' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found (Toronto to London, UK)' });
  });

  it('404 { error } when a location is not found', async () => {
    upstream.mockResolvedValueOnce({ data: { status: 'NOT_FOUND', results: [] } });
    const res = await get('/distance', { start: 'zzz', end: 'Toronto' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Location not found (zzz or Toronto)' });
  });

  it('404 { error } when geocoding finds nothing (ZERO_RESULTS)', async () => {
    const res = await get('/distance', { start: 'zzzzqqq', end: 'Toronto' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Location not found (zzzzqqq or Toronto)' });
    expect(callTo('computeRoutes')).toBeUndefined();
  });

  it('500 { error } on an unknown Google status', async () => {
    upstream.mockResolvedValueOnce({ data: { status: 'OVER_QUERY_LIMIT', results: [] } });
    const res = await get('/distance', { start: 'a', end: 'b' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An unknown error occurred (OVER_QUERY_LIMIT)' });
  });

  it('500 { error } with the Google error status when Routes rejects the call', async () => {
    upstream
      .mockImplementationOnce(async () => ({ data: fixture('google.geocode.forward.toronto') }))
      .mockImplementationOnce(async () => ({ data: fixture('google.geocode.forward.montreal') }))
      .mockImplementationOnce(async (config) => {
        throw httpError(config, 403, { error: { code: 403, status: 'PERMISSION_DENIED', message: 'blocked' } });
      });
    const res = await get('/distance', { start: 'Toronto', end: 'Montreal' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An unknown error occurred (PERMISSION_DENIED)' });
    expect(res.text).not.toContain('test-google-key');
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('test-google-key');
  });

  it('500 { error: string } on a network error (non-numeric cause is not used as a status)', async () => {
    const err = new Error('socket hang up', { cause: new Error('ECONNRESET') });
    upstream.mockRejectedValueOnce(err);
    const res = await get('/distance', { start: 'a', end: 'b' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'socket hang up' });
  });
});
