// POST /splitwise/token: server-side Splitwise OAuth code -> token exchange.
// The Splitwise token endpoint is faked per test; nothing reaches the network.

process.env.NODE_ENV = 'test';
process.env.CLIENT_API_KEY = 'test-client-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.RAPID_API_KEY = 'test-rapid-key-SECRET';

const PROD_ID = 'prod-client-id';
const PROD_SECRET = 'PROD-SPLITWISE-SECRET-xyz';
const DEV_ID = 'dev-client-id';
const DEV_SECRET = 'DEV-SPLITWISE-SECRET-abc';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  create: () => require('../helpers/upstream').api,
}));

const supertest = require('supertest');
const app = require('../../src/index');
const { api: upstream, httpError } = require('../helpers/upstream');
const { SPLITWISE_TOKEN_URL } = require('../../src/queries/splitwise');

const request = supertest(app);

const VALID_BODY = {
  code: 'auth-code-123',
  redirect_uri: 'gas-me-up://redirect',
  client_id: PROD_ID,
  code_verifier: 'verifier-456',
};
const post = (body = VALID_BODY, key = 'test-client-key') => {
  const req = request.post('/splitwise/token');
  if (key) req.set('x-api-key', key);
  return req.send(body);
};

const tokenResponse = (data) => upstream.mockImplementationOnce(async (config) => ({ status: 200, data, config }));
const tokenError = (status, data) => upstream.mockImplementationOnce(async (config) => {
  throw httpError(config, status, data);
});

let logSpy;
let errorSpy;
const logged = () => [...logSpy.mock.calls, ...errorSpy.mock.calls]
  .flat()
  .map((v) => (typeof v === 'string' ? v : JSON.stringify(v) ?? String(v)))
  .join('\n');

beforeEach(() => {
  process.env.SPLITWISE_CLIENT_ID = PROD_ID;
  process.env.SPLITWISE_CONSUMER_SECRET = PROD_SECRET;
  process.env.DEV_SPLITWISE_CLIENT_ID = DEV_ID;
  process.env.DEV_SPLITWISE_CONSUMER_SECRET = DEV_SECRET;
  upstream.mockClear();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  // Neither secret may ever be logged, whatever the test did.
  expect(logged()).not.toContain(PROD_SECRET);
  expect(logged()).not.toContain(DEV_SECRET);
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

const expectNoSecret = (res) => {
  const raw = JSON.stringify(res.body) + JSON.stringify(res.headers) + (res.text ?? '');
  expect(raw).not.toContain(PROD_SECRET);
  expect(raw).not.toContain(DEV_SECRET);
};

describe('POST /splitwise/token: success', () => {
  it('exchanges the code with the server-held secret and returns only the token', async () => {
    tokenResponse({ access_token: 'user-token', token_type: 'bearer', created_at: 123 });
    const res = await post();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ access_token: 'user-token', token_type: 'bearer' });
    expect(res.headers['cache-control']).toBe('no-store');
    expectNoSecret(res);

    expect(upstream).toHaveBeenCalledTimes(1);
    const config = upstream.mock.calls[0][0];
    expect(config.method).toBe('POST');
    expect(config.url).toBe(SPLITWISE_TOKEN_URL);
    expect(config.url).not.toContain(PROD_SECRET);
    expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const form = Object.fromEntries(new URLSearchParams(config.data));
    expect(form).toEqual({
      grant_type: 'authorization_code',
      client_id: PROD_ID,
      client_secret: PROD_SECRET,
      code: 'auth-code-123',
      redirect_uri: 'gas-me-up://redirect',
      code_verifier: 'verifier-456',
    });
  });

  it('uses the dev secret for the dev client id', async () => {
    tokenResponse({ access_token: 'dev-token', token_type: 'bearer' });
    const res = await post({ ...VALID_BODY, client_id: DEV_ID });
    expect(res.status).toBe(200);
    const form = new URLSearchParams(upstream.mock.calls[0][0].data);
    expect(form.get('client_id')).toBe(DEV_ID);
    expect(form.get('client_secret')).toBe(DEV_SECRET);
  });

  it('omits code_verifier when the app did not use PKCE', async () => {
    tokenResponse({ access_token: 't' });
    const { code_verifier: _omit, ...body } = VALID_BODY;
    const res = await post(body);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ access_token: 't', token_type: 'bearer' });
    expect(new URLSearchParams(upstream.mock.calls[0][0].data).has('code_verifier')).toBe(false);
  });

  it('passes through refresh_token / expires_in when present, nothing else', async () => {
    tokenResponse({
      access_token: 't', token_type: 'bearer', refresh_token: 'r', expires_in: 3600, scope: 'x', client_secret: PROD_SECRET,
    });
    const res = await post();
    expect(res.body).toEqual({
      access_token: 't', token_type: 'bearer', refresh_token: 'r', expires_in: 3600,
    });
    expectNoSecret(res);
  });

  it('accepts the legacy api_key query param', async () => {
    tokenResponse({ access_token: 't' });
    const res = await request.post('/splitwise/token').query({ api_key: 'test-client-key' }).send(VALID_BODY);
    expect(res.status).toBe(200);
  });
});

describe('POST /splitwise/token: errors', () => {
  it('401 without an API key, no upstream call', async () => {
    const res = await post(VALID_BODY, null);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid API Key' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('401 with a wrong API key', async () => {
    const res = await post(VALID_BODY, 'nope');
    expect(res.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([
    ['missing code', { ...VALID_BODY, code: undefined }],
    ['missing redirect_uri', { ...VALID_BODY, redirect_uri: undefined }],
    ['missing client_id', { ...VALID_BODY, client_id: undefined }],
    ['non-string code', { ...VALID_BODY, code: { $gt: '' } }],
    ['empty code', { ...VALID_BODY, code: '' }],
    ['non-string code_verifier', { ...VALID_BODY, code_verifier: 5 }],
  ])('400 for %s', async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing or invalid code, redirect_uri or client_id' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('400 for malformed JSON', async () => {
    const res = await request.post('/splitwise/token')
      .set('x-api-key', 'test-client-key')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request body' });
  });

  it('400 for a non-JSON body', async () => {
    const res = await request.post('/splitwise/token')
      .set('x-api-key', 'test-client-key')
      .type('form')
      .send('code=a&redirect_uri=b&client_id=c');
    expect(res.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('400 Unknown client_id for an unconfigured client', async () => {
    const res = await post({ ...VALID_BODY, client_id: 'someone-else' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown client_id' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('does not treat Object.prototype keys as client ids', async () => {
    const res = await post({ ...VALID_BODY, client_id: 'constructor' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown client_id' });
  });

  it('503 when the server has no Splitwise credentials', async () => {
    delete process.env.SPLITWISE_CLIENT_ID;
    delete process.env.SPLITWISE_CONSUMER_SECRET;
    delete process.env.DEV_SPLITWISE_CLIENT_ID;
    delete process.env.DEV_SPLITWISE_CONSUMER_SECRET;
    const res = await post();
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'Splitwise is not configured' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('a client id without its secret is not usable', async () => {
    delete process.env.SPLITWISE_CONSUMER_SECRET;
    const res = await post();
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown client_id' });
  });

  it.each([
    [400, { error: 'invalid_grant', error_description: 'The provided authorization grant is invalid' }, 'invalid_grant'],
    [401, { error: 'invalid_client', error_description: `bad secret ${PROD_SECRET}` }, 'invalid_client'],
    [400, { error: '<script>' }, 'invalid_request'],
    [400, 'plain text body', 'invalid_request'],
  ])('Splitwise %i -> 400 with only the OAuth error code', async (status, data, expected) => {
    tokenError(status, data);
    const res = await post();
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expected });
    expectNoSecret(res);
  });

  it('502 when Splitwise is down (5xx)', async () => {
    tokenError(503, '<html>maintenance</html>');
    const res = await post();
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Splitwise token exchange failed' });
    expectNoSecret(res);
  });

  it('502 on a network error; the logged AxiosError carries no secret', async () => {
    upstream.mockImplementationOnce(async (config) => {
      const { AxiosError } = jest.requireActual('axios');
      throw new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED', config, {});
    });
    const res = await post();
    expect(res.status).toBe(502);
    expectNoSecret(res);
    expect(logged()).toMatch(/ECONNREFUSED/);
  });

  it('502 when Splitwise answers 200 without an access_token', async () => {
    tokenResponse({ error: 'weird' });
    const res = await post();
    expect(res.status).toBe(502);
  });

  it('never logs the authorization code or access token', async () => {
    tokenResponse({ access_token: 'user-token-SENSITIVE' });
    await post({ ...VALID_BODY, code: 'auth-code-SENSITIVE' });
    expect(logged()).not.toContain('SENSITIVE');
  });
});
