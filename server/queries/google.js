export function DistanceMatrix (startLocation, endLocation) {
  return {
    method: 'get',
    url: `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLocation}&destinations=${endLocation}&units=metric&key=${process.env.GOOGLE_API_KEY}`,
    headers: { }
  }
}

export function LocationAutocomplete (input) {
  return {
    method: 'get',
    url: `https://maps.googleapis.com/maps/api/place/queryautocomplete/json?input=${input}&key=${process.env.GOOGLE_API_KEY}`,
    headers: { }
  }
}

export const mockTrip = {
  destination_addresses: [
    "Toronto, ON, Canada"
  ],
  origin_addresses: [
    "212 Golf Course Rd, Conestogo, ON N0B 1N0, Canada"
  ],
  rows: [
    {
      elements: [
        {
          distance: {
            text: "126 km",
            value: 126092
          },
          duration: {
            text: "1 hour 24 mins",
            value: 5031
          },
          status: "OK"
        }
      ]
    }
  ],
  status: "OK"
};
