// Live smoke tests: these hit the real Google Maps, RapidAPI gas-price and
// fueleconomy.gov APIs using the keys in server/.env. Run with `npm run test:live`.
// The default `npm test` runs the hermetic suite in test/hermetic instead.
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const { startServer } = require('../helpers/server');
const app = require('../../src/index');

// Upstreams (notably the gas-price service) can cold-start slowly.
jest.setTimeout(30000);

const api = startServer(app);

const get = (endpoint) => api
  .get(endpoint)
  .query({
    api_key: process.env.CLIENT_API_KEY,
  });

describe('Validation', () => {
  it('Requires API key', async () => {
    const response = await api.get('/suggestions')
      .query({ input: 'Toronto' });

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('error');
  });
});

describe('Location suggestion requests', () => {
  const endpoint = '/suggestions';
  it('should handle request', async () => {
    const searchedInput = 'Toronto';

    const response = await get(endpoint)
      .query({
        input: searchedInput,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('suggestions');
  });
});

describe('Distance requests', () => {
  const endpoint = '/distance'
  const start = 'Toronto';
  const end = 'Montreal';
  it('should handle request', async () => {
    const response = await get(endpoint)
      .query({
        start,
        end,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('distance');
  });

  it('should return latitude and longitude of start and end locations', async () => {
    const response = await get(endpoint)
      .query({
        start,
        end,
      });

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
  const endpoint = '/gas-prices';
  const country = 'CA';
  it('should handle request', async () => {
    const response = await get(endpoint)
      .query({
        country,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('prices');
  });
});

describe('Gas price requests', () => {
  const endpoint = '/gas';
  const country = 'CA';
  const region = 'Ontario';
  it('should handle request', async () => {
    const response = await get(endpoint)
      .query({
        country,
        region,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull();
    expect(response.body).toHaveProperty('price');
  });
});

describe('Vehicle requests', () => {
  describe('/years', () => {
    const endpoint = '/years';
    it('should handle request', async () => {
      const response = await get(endpoint);

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('years');
    })
  });

  describe('/makes', () => {
    const endpoint = '/makes';
    const year = 2020;
    it('should handle request', async () => {
      const response = await get(endpoint)
        .query({
          year,
        })

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('makes');
    })
  });

  describe('/models', () => {
    const endpoint = '/models';
    const year = 2020;
    const make = 'Honda';
    it('should handle request', async () => {
      const response = await get(endpoint)
        .query({
          year,
          make,
        })

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('models');
    })
  });


  describe('/model-options', () => {
    const endpoint = '/model-options';
    const year = '2020';
    const make = 'Honda';
    const model = 'Civic 5Dr';
    it('should handle request', async () => {
      const response = await get(endpoint)
        .query({
          year,
          make,
          model,
        })

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('modelOptions');
    })
  });

  describe('/vehicle', () => {
    const endpoint = '/vehicle';
    const vehicleId = '41385'
    it('should handle request', async () => {
      const response = await get(`${endpoint}/${vehicleId}`)


      expect(response.statusCode).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('mpg');
      expect(response.body).toHaveProperty('city');
      expect(response.body).toHaveProperty('highway');
      expect(response.body).toHaveProperty('fuelType');
    })
  });
});
