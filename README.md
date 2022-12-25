# GasMeUp ⛽

## React Native App

### Description 📚

An app to make splitting rides easier for everyone. A service to easily calculate your due gas-money and split easily to your riders. Just put in your riders, your route, and we will do the rest.

### Infrastructure 🏗️

The front end of this app was written in React Native and built using the Expo project manager. The backend is a Node.js server that hosts an Express API that the client can fetch data from. On this server we calculate the distances of routes and provide autocomplete location suggestions by utilizing the Google Maps API. The server also fetches current gas prices from my [Gas Price API](https://rapidapi.com/mmcardle-drx9FYQNK/api/canadian-gas-prices/).

### Related Concepts / Learnings 💭

* React Native
* Expo

<hr>
<br>

## Client

The client for this application is built using React Native. To start the Expo server run:

```
npm run client
```

## Server

The server for this application hosts an api using Express and Node.js. It fetches from an [API](https://rapidapi.com/mmcardle-drx9FYQNK/api/canadian-gas-prices/) I built for current gas prices and the Google Maps API for locations and route distances. To start the Node server, go to the /server directory and run:

```
npm run start
```

The server is hosted through Google Cloud's App Engine. To deploy a new version to production run the following command in the `/server` directory:

```
npm run deploy
```

## Demo Video
[![GasMeUp Thumbnail](https://i.ytimg.com/vi/z6_Ajiv4UBw/hqdefault.jpg)](https://youtube.com/shorts/z6_Ajiv4UBw?feature=share)
