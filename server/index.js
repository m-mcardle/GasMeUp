import dotenv from 'dotenv';

import localtunnel from 'localtunnel';

import express from 'express';

import axios from 'axios';
import pkg from 'axios-cache-adapter';

import { DistanceMatrix, LocationAutocomplete, mockTrip } from './src/queries/google';
import { GasPrices, mockPrices } from './src/queries/collectapi';

import { GasCostForDistance } from './src/calculations/fuel';

dotenv.config();

if (process.env.START_TUNNEL) {
  let tunnel;
  (async () => {
    tunnel = await localtunnel({ port: 3001, subdomain: 'carpoolcalc' });

    console.log('Localtunnel at:,', tunnel.url);
    tunnel.on('close', () => {
      // tunnels are closed
    });
  })();
}

const { setupCache } = pkg;

const PORT = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';

const app = express();

const cache = setupCache({
  maxAge: 24 * 60 * 60 * 1000,
});

const api = axios.create({
  adapter: cache.adapter,
});

// Handle GET requests for total gas cost for a trip
app.get('/trip-cost', async (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ?? 'Toronto';
  const province = 'Ontario'; // TODO - This should end up being determined by the user's location

  if (env === 'production' || process.env.ENABLE_GOOGLE_QUERIES) {
    try {
      // Make request to the Google Distance Matrix API
      const distanceResponse = await api(DistanceMatrix(startLocation, endLocation));
      const { data } = distanceResponse;
      console.log(data.rows[0].elements[0]);

      if (data?.rows[0]?.elements[0]?.status !== 'OK') {
        throw Error('Route not found');
      }
      const distance = data.rows[0].elements[0].distance.value / 1000;

      let gasPrice;
      if (env === 'production' || process.env.ENABLE_COLLECTAPI_QUERIES === true) {
        const priceResponse = await api(GasPrices('canada'));
        console.log(priceResponse.data);
        gasPrice = Number(priceResponse.data?.result.find((el) => el.name === province).gasoline);
      } else {
        // Mock Version:
        gasPrice = Number(mockPrices[6].gasoline);
      }
      console.log(`Distance: ${distance}km and Gas Price: $${gasPrice}`);

      const cost = GasCostForDistance(distance, gasPrice);

      res.set('Access-Control-Allow-Origin', '*');
      res.json({ cost, distance, gasPrice });
    } catch (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    }
  } else {
    const distance = mockTrip.rows[0].elements[0].distance.value / 1000;
    const gasPrice = Number(mockPrices[0].gasoline);

    const cost = GasCostForDistance(distance, gasPrice);

    res.set('Access-Control-Allow-Origin', '*');
    res.json({ cost });
  }
});

// Handle autocomplete for locations
app.get('/location', async (req, res) => {
  const input = req.query?.input ?? 'Toronto';

  if (env === 'production' || process.env.ENABLE_GOOGLE_QUERIES) {
    try {
      const response = await api(LocationAutocomplete(input));
      const { data } = response;
      if (data.status !== 'OK') {
        throw Error(`Error: ${data.error_message}`);
      }
      const { predictions } = data;
      // Probably should filter to only send the description
      res.set('Access-Control-Allow-Origin', '*');
      res.json({ predictions });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: 'An error occurred' });
    }
  } else {
    res.status(500).send({ error: 'No mock data to supply' });
  }
});

// Handle GET requests for distances between two locations
app.get('/distances', (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ?? 'Toronto';

  if (env === 'production') {
    // Make request to the Google Distance Matrix API
    api(DistanceMatrix(startLocation, endLocation))
      .then((response) => {
        const { data } = response;
        console.log(JSON.stringify(data));
        if (data.status === 'OK') {
          res.set('Access-Control-Allow-Origin', '*');
          res.json(data.rows[0].elements[0]);
        } else {
          res.status(500).send('An error occurred');
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send('An error occurred');
      });
  } else {
    res.set('Access-Control-Allow-Origin', '*');
    res.json(mockTrip.rows[0].elements[0]);
  }
});

// Handle GET requests to /gas-prices route, provide list of gas prices of all provinces in Canada
app.get('/gas-prices', (req, res) => {
  if (env === 'production') {
    // Api request to fetch gas prices in Canada
    api(GasPrices('canada'))
      .then((response) => {
        console.log(`statusCode: ${response.status}`);
        console.log(response.data);
        const gasPrices = response.data?.result;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({ prices: gasPrices });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  } else {
    // In dev just use mock data to save my limited requests to CollectAPI
    res.set('Access-Control-Allow-Origin', '*');
    res.json(mockPrices);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
