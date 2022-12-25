# GasMeUp - Server

This directory contains the code for the Node.js server for the application. It will return data for the current gas prices and data from Google's APIs.

<hr>
<br>

## Server

This directory contains the code to host an Node.js server using Express

To start the Node server run:

```
npm run start
```

To deploy to Google App Engine:

```
npm run deploy
```

<hr>
<br>

## Dependencies

Using requests to my Gas Price API for current gas prices. ([Docs](https://rapidapi.com/mmcardle-drx9FYQNK/api/canadian-gas-prices/))

Using requests to Google's Distance Matrix API to calculate the distance of a route. ([Docs](https://developers.google.com/maps/documentation/distance-matrix/)) and Google's Place Autocomplete to return suggestions to the user ([Docs](https://developers.google.com/maps/documentation/places/web-service/autocomplete)).
