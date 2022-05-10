import dotenv from 'dotenv';
dotenv.config()

import express from 'express';

import axios from 'axios';
import pkg from 'axios-cache-adapter';
const { setupCache } = pkg;


import { DistanceMatrix, mockTrip } from './queries/google.js';
import { GasPrices, mockPrices } from './queries/collectapi.js';

import { GasCostForDistance } from './calculations/fuel.js';

const PORT = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';


const app = express();

const cache = setupCache({
  maxAge: 24 * 60 * 60 * 1000
});

const api = axios.create({
  adapter: cache.adapter
});

// Handle GET requests for total gas cost for a trip
app.get("/trip-cost", async (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ??'Toronto';
  const province = 'Ontario'; // This should end up being determined by the user's location

  if (env === 'production' || process.env.ENABLE_GOOGLE_QUERIES) {

    try {
      // Make request to the Google Distance Matrix API
      const distanceResponse = await api(DistanceMatrix(startLocation, endLocation));
      const data = distanceResponse.data;
      console.log(data.rows[0])
      console.log(data.rows[0].elements[0])

      if (data?.rows[0]?.elements[0].status !== 'OK') {
        throw 'Route not found';
      }
      const distance = data.rows[0].elements[0].distance.value / 1000;

      let gasPrice;
      if (env === 'production' || process.env.ENABLE_COLLECTAPI_QUERIES == true) {
        const priceResponse = await api(GasPrices('canada'));
        console.log(priceResponse.data);
        gasPrice = priceResponse.data?.result.find(el => el.name === province).gasoline;
      } else {
        // Mock Version:
        gasPrice = mockPrices[6].gasoline;
      }
      console.log(`Distance: ${distance}km and Gas Price: $${gasPrice}`);

      const cost = GasCostForDistance(distance, gasPrice);

      res.set('Access-Control-Allow-Origin', '*');
      res.json({ cost });
    } catch (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    }
  } else {

    const distance = mockTrip.rows[0].elements[0].distance.value / 1000;
    const gasPrice = mockPrices[0].gasoline;

    const cost = GasCostForDistance(distance, gasPrice);

    res.set('Access-Control-Allow-Origin', '*');
    res.json({ cost });
  }  
});

// Handle GET requests for distances between two locations
app.get("/distances", (req, res) => {
  const startLocation = req.query?.start ?? '212 Golf Course Road Conestogo Ontario';
  const endLocation = req.query?.end ??'Toronto';

  if (env === 'production') {
    // Make request to the Google Distance Matrix API
    api(DistanceMatrix(startLocation, endLocation))
      .then(function (response) {
        const data = response.data;
        console.log(JSON.stringify(data));
        if (data.status === 'OK') {
          res.set('Access-Control-Allow-Origin', '*');
          res.json(data.rows[0].elements[0]);
        } else {
          console.error(error);
          res.status(500).send("An error occurred")
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    res.set('Access-Control-Allow-Origin', '*');
    res.json(mockTrip.rows[0].elements[0]);
  }
});


// Handle GET requests to /gas-prices route, provide list of gas prices of all provinces in Canada
app.get("/gas-prices", (req, res) => {

  if (env === 'production') {
    // Api request to fetch gas prices in Canada
    api(GasPrices('canada'))
      .then(response => {
        console.log(`statusCode: ${response.status}`);
        console.log(response.data)
        const gasPrices = response.data?.result;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({ prices: gasPrices });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send("An error occurred")
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