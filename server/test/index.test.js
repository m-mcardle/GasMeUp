const supertest = require('supertest');
const app = require('../src/index');

const api = supertest(app);

describe('Trip cost requests', () => {
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
  const endpoint = '/location';
  it('should handle request', async () => {
    const searchedInput = 'Toronto';

    const response = await api
      .get(endpoint)
      .query({
        location: searchedInput,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
  });
});

describe('Distance requests', () => {
  const endpoint = '/distance';
  it('should handle request', async () => {
    const response = await api
      .get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
  });
});

describe('Gas price requests', () => {
  const endpoint = '/gas-price';
  it('should handle request', async () => {
    const response = await api
      .get(endpoint);

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
  });
});
