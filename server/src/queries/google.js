function DistanceMatrix(startLocation, endLocation) {
  return {
    method: 'get',
    url: encodeURI(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLocation}&destinations=${endLocation}&units=metric&key=${process.env.GOOGLE_API_KEY}`),
    headers: { },
  };
}

function LocationAutocomplete(input, sessionId, location) {
  return {
    method: 'get',
    url: encodeURI('https://maps.googleapis.com/maps/api/place/autocomplete/json'),
    params: {
      input,
      key: process.env.GOOGLE_API_KEY,
      sessiontoken: sessionId,
      location,
      radius: 40000,
    }
  };
}

function Directions(startLocation, endLocation) {
  return {
    method: 'get',
    url: encodeURI(`https://maps.googleapis.com/maps/api/directions/json?mode=driving&origin=${startLocation}&destination=${endLocation}&key=${process.env.GOOGLE_API_KEY}`),
    headers: { },
  };
}

function Place(placeId) {
  return {
    method: 'get',
    url: encodeURI('https://maps.googleapis.com/maps/api/place/details/json'),
    params: {
      placeid: placeId,
      key: process.env.GOOGLE_API_KEY,
    }
  }
}

function Geocode(latlng) {
  return {
    method: 'get',
    url: encodeURI('https://maps.googleapis.com/maps/api/geocode/json'),
    params: {
      latlng,
      key: process.env.GOOGLE_API_KEY,
    }
  }
}

/*
Google Maps Platform "new" APIs: Places API (New) + Routes API.
Selected with GOOGLE_MAPS_API=new (see mapsApiMode). These send the API key as a
header (never in the URL) plus a response field mask, which trims the payload and
keeps each call on the cheapest SKU that returns those fields.
*/
const PLACES_BASE = 'https://places.googleapis.com/v1';
const ROUTES_BASE = 'https://routes.googleapis.com';

// Autocomplete (New): only the full prediction text is used (legacy `description`).
const AUTOCOMPLETE_FIELD_MASK = 'suggestions.placePrediction.text.text';
// Place Details (New): formattedAddress is a Place Details Essentials field.
const PLACE_FIELD_MASK = 'formattedAddress';
// computeRoutes: everything needed to rebuild the legacy Directions `data` payload.
// None of these (no traffic, tolls, or advisories) lift the request above the
// Compute Routes Essentials SKU.
const ROUTES_FIELD_MASK = [
  'routes.description',
  'routes.warnings',
  'routes.viewport',
  'routes.polyline.encodedPolyline',
  'routes.legs.distanceMeters',
  'routes.legs.duration',
  'routes.legs.startLocation',
  'routes.legs.endLocation',
  'routes.legs.localizedValues',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.startLocation',
  'routes.legs.steps.endLocation',
  'routes.legs.steps.polyline.encodedPolyline',
  'routes.legs.steps.navigationInstruction',
  'routes.legs.steps.localizedValues',
].join(',');

const LAT_LNG_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
// Places (New) session tokens must be URL/filename-safe base64, at most 36 chars
// (the app's UUIDv4 `session` fits). Anything else is dropped rather than failing
// the whole request, as the legacy API accepted any string.
const SESSION_TOKEN_RE = /^[A-Za-z0-9_-]{1,36}$/;

// GOOGLE_MAPS_API=new|legacy (default legacy). Read per call so it can be flipped
// without code changes.
function mapsApiMode() {
  return process.env.GOOGLE_MAPS_API === 'new' ? 'new' : 'legacy';
}

function parseLatLng(value) {
  const match = typeof value === 'string' && value.match(LAT_LNG_RE);
  return match ? { latitude: Number(match[1]), longitude: Number(match[2]) } : null;
}

function newApiHeaders(fieldMask) {
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
    'X-Goog-FieldMask': fieldMask,
  };
}

function PlacesAutocompleteNew(input, sessionId, location) {
  const data = { input };
  if (typeof sessionId === 'string' && SESSION_TOKEN_RE.test(sessionId)) {
    data.sessionToken = sessionId;
  }
  const center = parseLatLng(location);
  if (center) {
    // Same 40km bias the legacy `location` + `radius` params applied.
    data.locationBias = { circle: { center, radius: 40000 } };
  }
  return {
    method: 'post',
    url: `${PLACES_BASE}/places:autocomplete`,
    headers: newApiHeaders(AUTOCOMPLETE_FIELD_MASK),
    data,
  };
}

function PlaceDetailsNew(placeId) {
  return {
    method: 'get',
    url: `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`,
    headers: newApiHeaders(PLACE_FIELD_MASK),
  };
}

// Forward geocode used by new-mode /distance to resolve free-text start/end the
// way legacy Directions did internally (formatted address + place_id). The
// Geocoding API is not a legacy product.
function ForwardGeocode(address) {
  return {
    method: 'get',
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    params: {
      address,
      key: process.env.GOOGLE_API_KEY,
    },
  };
}

// `origin` / `destination` are Routes API waypoints, e.g. { placeId } or
// { location: { latLng: { latitude, longitude } } }.
function ComputeRoutes(origin, destination) {
  return {
    method: 'post',
    url: `${ROUTES_BASE}/directions/v2:computeRoutes`,
    headers: newApiHeaders(ROUTES_FIELD_MASK),
    data: {
      origin,
      destination,
      travelMode: 'DRIVE',
      // TRAFFIC_UNAWARE keeps the call on the Essentials SKU and matches the
      // legacy Directions request, which did not ask for traffic either.
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineEncoding: 'ENCODED_POLYLINE',
    },
  };
}

const mockTrip = {
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

const mockLocations = {
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

module.exports = {
  mapsApiMode,
  parseLatLng,
  PlacesAutocompleteNew,
  PlaceDetailsNew,
  ForwardGeocode,
  ComputeRoutes,
  ROUTES_FIELD_MASK,
  DistanceMatrix,
  LocationAutocomplete,
  Directions,
  Place,
  Geocode,
  mockTrip,
  mockLocations,
};
