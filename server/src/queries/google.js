export function DistanceMatrix(startLocation, endLocation) {
  return {
    method: 'get',
    url: `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLocation}&destinations=${endLocation}&units=metric&key=${process.env.GOOGLE_API_KEY}`,
    headers: { },
  };
}

export function LocationAutocomplete(input) {
  return {
    method: 'get',
    url: `https://maps.googleapis.com/maps/api/place/queryautocomplete/json?input=${input}&key=${process.env.GOOGLE_API_KEY}`,
    headers: { },
  };
}

export const mockTrip = {
  destination_addresses: [
    'Toronto, ON, Canada',
  ],
  origin_addresses: [
    '212 Golf Course Rd, Conestogo, ON N0B 1N0, Canada',
  ],
  rows: [
    {
      elements: [
        {
          distance: {
            text: '126 km',
            value: 126092,
          },
          duration: {
            text: '1 hour 24 mins',
            value: 5031,
          },
          status: 'OK',
        },
      ],
    },
  ],
  status: 'OK',
};

export const mockLocations = {
  predictions: [
    {
      description: 'Cancún, Quintana Roo, Mexico',
      matched_substrings: [Array],
      place_id: 'ChIJ21P2rgUrTI8Ris1fYjy3Ms4',
      reference: 'ChIJ21P2rgUrTI8Ris1fYjy3Ms4',
      structured_formatting: [Object],
      terms: [Array],
      types: [Array],
    },
    {
      description: 'Chicago, IL, USA',
      matched_substrings: [Array],
      place_id: 'ChIJ7cv00DwsDogRAMDACa2m4K8',
      reference: 'ChIJ7cv00DwsDogRAMDACa2m4K8',
      structured_formatting: [Object],
      terms: [Array],
      types: [Array],
    },
    {
      description: 'Chennai, Tamil Nadu, India',
      matched_substrings: [Array],
      place_id: 'ChIJYTN9T-plUjoRM9RjaAunYW4',
      reference: 'ChIJYTN9T-plUjoRM9RjaAunYW4',
      structured_formatting: [Object],
      terms: [Array],
      types: [Array],
    },
    {
      description: 'Cinque Terre, SP, Italy',
      matched_substrings: [Array],
      place_id: 'ChIJe7qrmhvu1BIRrPRwGvHOlf8',
      reference: 'ChIJe7qrmhvu1BIRrPRwGvHOlf8',
      structured_formatting: [Object],
      terms: [Array],
      types: [Array],
    },
    {
      description: 'Charlotte, NC, USA',
      matched_substrings: [Array],
      place_id: 'ChIJgRo4_MQfVIgRZNFDv-ZQRog',
      reference: 'ChIJgRo4_MQfVIgRZNFDv-ZQRog',
      structured_formatting: [Object],
      terms: [Array],
      types: [Array],
    },
  ],
  status: 'OK',
};
