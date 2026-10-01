// GET /exchange-rate: server-side proxy so the ExchangeRate-API key leaves the app.
// The route caches per currency pair; the cache is cleared before every test.

process.env.NODE_ENV = 'test';
process.env.CLIENT_API_KEY = 'test-client-key';
process.env.EXCHANGE_RATE_API_KEY = 'test-exchange-key-SECRET';

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
const get = (query = {}) => request.get('/exchange-rate').set('x-api-key', 'test-client-key').query(query);

let logSpy;
beforeEach(() => {
  process.env.EXCHANGE_RATE_API_KEY = 'test-exchange-key-SECRET';
  resetUpstream();
  app.locals.clearCaches();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  expect(JSON.stringify(logSpy.mock.calls)).not.toContain('test-exchange-key-SECRET');
  logSpy.mockRestore();
});

describe('GET /exchange-rate', () => {
  it('CONTRACT: { rate } for CAD -> USD by default; key only in the Authorization header', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rate: fixture('exchangerate.pair').conversion_rate });
    expect(res.headers['access-control-allow-origin']).toBe('*');

    const config = upstream.mock.calls[0][0];
    expect(config.url).toBe('https://v6.exchangerate-api.com/v6/pair/CAD/USD');
    expect(config.url).not.toContain('SECRET');
    expect(config.headers.Authorization).toBe('Bearer test-exchange-key-SECRET');
  });

  it('caches a pair for subsequent requests', async () => {
    await get({ from: 'USD', to: 'CAD' });
    await get({ from: 'USD', to: 'CAD' });
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(upstream.mock.calls[0][0].url).toMatch(/\/pair\/USD\/CAD$/);
  });

  it('401 without an API key', async () => {
    const res = await request.get('/exchange-rate');
    expect(res.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([
    [{ from: 'cad' }],
    [{ to: 'US' }],
    [{ from: '../x' }],
  ])('400 for invalid currency %o', async (query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('502 { error } when upstream reports an error, without leaking the key', async () => {
    upstream.mockResolvedValueOnce({ data: { result: 'error', 'error-type': 'invalid-key' } });
    const res = await get({ from: 'EUR', to: 'USD' });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Exchange rate lookup failed' });
    expect(JSON.stringify(res.body)).not.toContain('SECRET');
  });

  it('502 when upstream throws', async () => {
    upstream.mockRejectedValueOnce(new Error('boom'));
    const res = await get({ from: 'GBP', to: 'USD' });
    expect(res.status).toBe(502);
  });

  it('503 when the server has no EXCHANGE_RATE_API_KEY', async () => {
    delete process.env.EXCHANGE_RATE_API_KEY;
    const res = await get({ from: 'JPY', to: 'USD' });
    expect(res.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
});
