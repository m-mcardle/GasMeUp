interface GasPrice {
  name: string,
  currency: string,
  gasoline: number
}

interface KeyValue {
  text: string,
  value: number,
}

interface TripDistance {
  distance: KeyValue,
  duration: KeyValue,
  status: string
}

interface CostRequest {
  loading: boolean,
  distance: number,
  gasPrice: number,
  start: {
    lat: number,
    lng: number,
    address: string,
  },
  end: {
    lat: number,
    lng: number,
    address: string,
  }
}

interface Prediction {
  description: string
}

interface InputState {
  suggestions: Array<string>,
  startLocation: string,
  endLocation: string
}

interface Locations {
  startLocation: string,
  endLocation: string
}

interface LatLng {
  lat: number,
  lng: number
}

interface Location {
  latitude: number,
  longitude: number,
}
