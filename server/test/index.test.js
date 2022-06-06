const supertest = require('supertest');
const app = require('../src/index');

const api = supertest(app);

describe('Trip cost requests', () => {
  jest.setTimeout(10000);
  const endpoint = '/trip-cost';
  it('should handle request', async () => {
    const response = await api
      .get(endpoint);

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

    const response = await api
      .get(endpoint)
      .query({
        location: searchedInput,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('suggestions');
  });
});

describe('Distance requests', () => {
  const endpoint = '/distance';
  it('should handle request', async () => {
    const response = await api
      .get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('distance');
  });
});

describe('Gas price requests', () => {
  jest.setTimeout(10000);
  const endpoint = '/gas-prices';
  it('should handle request', async () => {
    const response = await api
      .get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('prices');
  });
});
