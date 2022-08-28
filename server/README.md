# GasMeUp

An app to make carpooling easier for everyone. A service to easily calculate your due gas-money and split easily to your riders. Just put in your riders, your route, and we will do the rest.

<hr>
<br>

## Server

This directory contains the code to host an Node.js server using Express

To publicly host the api for this server run:
```
lt --port 3001 --subdomain gas-me-up
```

To start the Node server run:
```
npm run start
```

<hr>
<br>

## Dependencies

Using requests to CollectAPI for current gas prices. ([Docs](https://collectapi.com/api/gasPrice/))

Using requests to Google's Distance Matrix API to calculate the distance of a route. ([Docs](https://developers.google.com/maps/documentation/distance-matrix/))
