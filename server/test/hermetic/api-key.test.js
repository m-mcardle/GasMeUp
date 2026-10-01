// Client API key transport: the app now sends the `x-api-key` header; shipped
// builds still send the `api_key` query param. Both must keep working.

process.env.NODE_ENV = 'test';
process.env.CLIENT_API_KEY = 'test-client-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.RAPID_API_KEY = 'test-rapid-key-SECRET';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  create: () => require('../helpers/upstream').api,
}));

const supertest = require('supertest');
const app = require('../../src/index');
const { api: upstream } = require('../helpers/upstream');
const { validateAPIKey } = require('../../src/utils/validation');

const request = supertest(app);

let logSpy;
beforeEach(() => {
  upstream.mockClear();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

const DATA_ROUTES = [
  ['/suggestions', { input: 'Toronto' }],
  ['/place', { placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' }],
  ['/geocode', { latlng: '43.6532,-79.3832' }],
  ['/distance', { start: 'Toronto', end: 'Montreal' }],
  ['/gas-prices', {}],
  ['/gas', {}],
  ['/years', {}],
  ['/makes', {}],
  ['/models', {}],
  ['/model-options', {}],
  ['/vehicle/41385', {}],
];

describe('x-api-key header', () => {
  it.each(DATA_ROUTES)('%s accepts the key in the x-api-key header', async (route, query) => {
    const res = await request.get(route).set('x-api-key', 'test-client-key').query(query);
    expect(res.status).toBe(200);
  });

  it.each(DATA_ROUTES)('%s still accepts the legacy api_key query param', async (route, query) => {
    const res = await request.get(route).query({ api_key: 'test-client-key', ...query });
    expect(res.status).toBe(200);
  });

  it.each(DATA_ROUTES)('%s rejects a wrong header key with 401', async (route, query) => {
    const res = await request.get(route).set('x-api-key', 'nope').query(query);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid API Key' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('the header wins over the query param when both are sent', async () => {
    const wrongHeader = await request.get('/years').set('x-api-key', 'nope').query({ api_key: 'test-client-key' });
    expect(wrongHeader.status).toBe(401);
    const rightHeader = await request.get('/years').set('x-api-key', 'test-client-key').query({ api_key: 'nope' });
    expect(rightHeader.status).toBe(200);
  });

  it('rejects a repeated api_key query param (array) with 401', async () => {
    const res = await request.get('/years?api_key=test-client-key&api_key=test-client-key');
    expect(res.status).toBe(401);
  });
});

describe('validateAPIKey', () => {
  const saved = process.env.CLIENT_API_KEY;
  afterEach(() => { process.env.CLIENT_API_KEY = saved; });

  it('rejects everything when CLIENT_API_KEY is not configured', () => {
    delete process.env.CLIENT_API_KEY;
    expect(validateAPIKey(undefined)).toBe(false);
    expect(validateAPIKey('')).toBe(false);
    expect(validateAPIKey('anything')).toBe(false);
  });

  it('compares exactly', () => {
    expect(validateAPIKey('test-client-key')).toBe(true);
    expect(validateAPIKey('test-client-ke')).toBe(false);
    expect(validateAPIKey('test-client-keyy')).toBe(false);
    expect(validateAPIKey(['test-client-key'])).toBe(false);
  });

  it('a request without a key is rejected even if the server key is missing', async () => {
    delete process.env.CLIENT_API_KEY;
    const res = await request.get('/years');
    expect(res.status).toBe(401);
  });
});

describe('CORS preflight', () => {
  it('allows the x-api-key header', async () => {
    const res = await request.options('/suggestions')
      .set('Origin', 'http://localhost:8083')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'x-api-key');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-headers']).toMatch(/x-api-key/);
  });
});
