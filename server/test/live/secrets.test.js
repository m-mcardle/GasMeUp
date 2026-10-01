// Live smoke tests for the routes that hold third-party secrets server-side.
// Run with `npm run test:live` (needs server/.env). Each block is skipped when
// its credentials are not configured.
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const supertest = require('supertest');
const app = require('../../src/index');

jest.setTimeout(30000);

const api = supertest(app);

const describeIf = (condition) => (condition ? describe : describe.skip);

describeIf(process.env.EXCHANGE_RATE_API_KEY)('GET /exchange-rate (live)', () => {
  it('returns a plausible CAD -> USD rate', async () => {
    const res = await api.get('/exchange-rate').set('x-api-key', process.env.CLIENT_API_KEY);
    expect(res.statusCode).toBe(200);
    expect(res.body.rate).toBeGreaterThan(0.4);
    expect(res.body.rate).toBeLessThan(1.5);
  });
});

// A made-up code must be rejected as invalid_grant. invalid_client instead
// would mean the configured client id / secret pair is wrong.
describe.each([
  ['prod', 'SPLITWISE_CLIENT_ID', 'SPLITWISE_CONSUMER_SECRET'],
  ['dev', 'DEV_SPLITWISE_CLIENT_ID', 'DEV_SPLITWISE_CONSUMER_SECRET'],
])('POST /splitwise/token (live, %s client)', (_name, idVar, secretVar) => {
  const configured = process.env[idVar] && process.env[secretVar];
  (configured ? it : it.skip)('rejects a fake authorization code with invalid_grant', async () => {
    const res = await api.post('/splitwise/token')
      .set('x-api-key', process.env.CLIENT_API_KEY)
      .send({
        code: 'not-a-real-code',
        redirect_uri: 'gas-me-up://redirect',
        client_id: process.env[idVar],
        code_verifier: 'x'.repeat(43),
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_grant' });
    expect(JSON.stringify(res.body)).not.toContain(process.env[secretVar]);
  });
});
