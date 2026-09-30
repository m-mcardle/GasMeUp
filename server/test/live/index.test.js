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
  jest.setTimeout(10000);

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
  jest.setTimeout(10000);

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
