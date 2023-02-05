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

interface Transaction {
  amount: number,
  cost: number,
  payeeUID: string,
  payers: Array<string>,
  splitType?: 'split' | 'full'
  date: Date,
  distance: number,
  gasPrice: number,
  startLocation?: string,
  endLocation?: string,
  gasMileage?: number,
  creator: string,
  type: 'settle' | 'trip',
  users: Array<string>,
  waypoints?: Array<Location>,
  country?: string,
}
