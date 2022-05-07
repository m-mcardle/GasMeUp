# CarpoolCalc

An app to make carpooling easier for everyone. A service to easily calculate your due gas-money and split easily to your riders. Just put in your riders, your route, and we will do the rest.

## Server

This directory contains the code to host an Node.js server using Express

For development run:
```
  lt --port 3001
```

and then use that url in the client fetch requests to link the client to the server

## Dependencies

Using requests to CollectAPI for current gas prices. ([Docs](https://collectapi.com/api/gasPrice/))
