require('dotenv').config();
const express = require("express");
const http = require("https");
const axios = require('axios').default;
const {setupCache} = require('axios-cache-adapter')

const PORT = process.env.PORT || 3001;



const app = express();

const cache = setupCache({
  maxAge: 24 * 60 * 60 * 1000
});

const api = axios.create({
  adapter: cache.adapter
});

// Handle GET requests to /gas-prices route, provide list of gas prices of all provinces in Canada
app.get("/gas-prices", (req, res) => {

  const options = {
    headers: {
      "content-type": "application/json",
      "authorization": `apikey ${process.env.API_KEY}`
    }
  };

  // Api request to fetch gas prices in Canada
  api
    .get('https://api.collectapi.com/gasPrice/canada', options)
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
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});