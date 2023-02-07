// TODO - These tests don't actually fetch from Google API
// * Need to set `ENABLE_GOOGLE_QUERIES` to `true` in `.env`
const dotenv = require('dotenv');

const supertest = require('supertest');
const app = require('../src/index');

dotenv.config();

const api = supertest(app);

const get = (endpoint) => api
  .get(endpoint)
  .query({
    api_key: process.env.CLIENT_API_KEY,
  });

describe('Trip cost requests', () => {
  jest.setTimeout(10000);
  const endpoint = '/trip-cost';
  it('should handle request', async () => {
    const response = await get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('cost');
    expect(response.body).toHaveProperty('distance');
    expect(response.body).toHaveProperty('gasPrice');
  });
});

describe('Location suggestion requests', () => {
  const endpoint = '/suggestions';
  it('should handle request', async () => {
    const searchedInput = 'Toronto';

    const response = await get(endpoint)
      .query({
        location: searchedInput,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('suggestions');
  });
});

describe('Distance requests', () => {
  const endpoint = '/distance?start=Toronto&end=Montreal';
  it('should handle request', async () => {
    const response = await get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('distance');
  });

  it('should return latitude and longitude of start and end locations', async () => {
    const response = await get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('start');
    expect(response.body.start).toHaveProperty('lat');
    expect(response.body.start).toHaveProperty('lng');
    expect(response.body).toHaveProperty('end');
    expect(response.body.end).toHaveProperty('lat');
    expect(response.body.end).toHaveProperty('lng');
  });
});

describe('Gas prices requests', () => {
  jest.setTimeout(10000);

  const endpoint = '/gas-prices?country=CA&region=Ontario';
  it('should handle request', async () => {
    const response = await get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('prices');
  });
});

describe('Gas price requests', () => {
  jest.setTimeout(10000);

  const endpoint = '/gas?country=CA&region=Ontario';
  it('should handle request', async () => {
    const response = await get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('price');
  });
});
