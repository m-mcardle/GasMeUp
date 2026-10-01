// Unit tests for the new-API -> legacy-shape mappers in src/adapters/google.js.
const {
  toLegacyDirections, toLegacySuggestions, formatDistance, formatDuration, toLegacyManeuver,
} = require('../../src/adapters/google');
const { fixture } = require('../helpers/upstream');

describe('formatDistance / formatDuration fallbacks match legacy Directions text', () => {
  const legacy = fixture('google.directions').routes[0].legs[0];
  const samples = [legacy, ...legacy.steps];

  it.each(samples.map((s) => [s.distance.value, s.distance.text]))('%i m -> %s', (meters, text) => {
    expect(formatDistance(meters)).toBe(text);
  });

  it.each(samples.map((s) => [s.duration.value, s.duration.text]))('%i s -> %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });

  it('handles short distances, exact hours and multi-day trips', () => {
    expect(formatDistance(45)).toBe('45 m');
    expect(formatDuration(3600)).toBe('1 hour');
    expect(formatDuration(2 * 86400 + 3 * 3600 + 120)).toBe('2 days 3 hours');
  });
});

describe('toLegacyManeuver', () => {
  it.each([
    ['RAMP_LEFT', 'ramp-left'],
    ['TURN_SLIGHT_RIGHT', 'turn-slight-right'],
    ['MERGE', 'merge'],
    ['ROUNDABOUT_LEFT', 'roundabout-left'],
    ['DEPART', undefined],
    ['NAME_CHANGE', undefined],
    [undefined, undefined],
  ])('%s -> %s', (input, output) => {
    expect(toLegacyManeuver(input)).toBe(output);
  });
});

describe('toLegacyDirections', () => {
  const origin = { address: 'A St', placeId: 'pid-a', types: ['street_address'] };
  const destination = { address: 'B St', placeId: 'pid-b' };

  it('falls back to computed text when localizedValues is absent', () => {
    const data = toLegacyDirections({
      routes: [{
        legs: [{
          distanceMeters: 2886,
          duration: '743s',
          startLocation: { latLng: { latitude: 1, longitude: 2 } },
          endLocation: { latLng: { latitude: 3, longitude: 4 } },
          steps: [{ distanceMeters: 222, staticDuration: '22s', navigationInstruction: { maneuver: 'TURN_LEFT', instructions: 'Turn left' } }],
        }],
      }],
    }, origin, destination);

    expect(data.status).toBe('OK');
    expect(data.geocoded_waypoints).toEqual([
      { geocoder_status: 'OK', place_id: 'pid-a', types: ['street_address'] },
      { geocoder_status: 'OK', place_id: 'pid-b', types: [] },
    ]);
    const leg = data.routes[0].legs[0];
    expect(leg.distance).toEqual({ text: '2.9 km', value: 2886 });
    expect(leg.duration).toEqual({ text: '12 mins', value: 743 });
    expect(leg.start_address).toBe('A St');
    expect(leg.end_address).toBe('B St');
    expect(leg.start_location).toEqual({ lat: 1, lng: 2 });
    expect(leg.steps[0]).toMatchObject({
      distance: { text: '0.2 km', value: 222 },
      duration: { text: '1 min', value: 22 },
      maneuver: 'turn-left',
      html_instructions: 'Turn left',
      travel_mode: 'DRIVING',
    });
  });

  it('reports ZERO_RESULTS for an empty computeRoutes response', () => {
    expect(toLegacyDirections({}, origin, destination)).toMatchObject({ routes: [], status: 'ZERO_RESULTS' });
  });
});

describe('toLegacySuggestions', () => {
  it('keeps only place prediction texts, in order', () => {
    expect(toLegacySuggestions({
      suggestions: [
        { placePrediction: { text: { text: 'Toronto, ON, Canada' } } },
        { queryPrediction: { text: { text: 'toronto pizza' } } },
        { placePrediction: { text: { text: 'Toronto Island, Toronto, ON, Canada' } } },
      ],
    })).toEqual(['Toronto, ON, Canada', 'Toronto Island, Toronto, ON, Canada']);
    expect(toLegacySuggestions({})).toEqual([]);
  });
});
