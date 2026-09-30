/* eslint-disable no-console */
// Re-records the upstream fixtures used by the hermetic test suite.
//
//   node test/fixtures/record.js
//
// Requires a populated server/.env (GOOGLE_API_KEY, RAPID_API_KEY). Makes real,
// billable calls to Google Maps, RapidAPI and fueleconomy.gov. Large payloads are
// trimmed so fixtures stay small while keeping the fields the server reads.
const fs = require('fs');
const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

const google = require('../../src/queries/google');
const gas = require('../../src/queries/gasprice');
const fe = require('../../src/queries/fueleconomy');

const secrets = [process.env.GOOGLE_API_KEY, process.env.RAPID_API_KEY, process.env.CLIENT_API_KEY]
  .filter(Boolean);

function trimDirections(data) {
  if (!data.routes?.length) return data;
  const route = data.routes[0];
  const leg = route.legs[0];
  return {
    ...data,
    routes: [{
      ...route,
      overview_polyline: { points: route.overview_polyline.points.slice(0, 64) },
      legs: [{
        ...leg,
        steps: leg.steps.slice(0, 3).map((s) => ({ ...s, polyline: { points: s.polyline.points.slice(0, 32) } })),
      }],
    }],
  };
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

const recordings = {
  'google.autocomplete.json': [google.LocationAutocomplete('Toronto', 'fixture-session', '43.65,-79.38')],
  'google.place.json': [google.Place('ChIJpTvG15DL1IkRd8S0KlBVNTI'), (d) => ({ ...d, result: pick(d.result ?? {}, ['formatted_address', 'geometry', 'name', 'place_id', 'types']) })],
  'google.geocode.json': [google.Geocode('43.6532,-79.3832'), (d) => ({ ...d, results: (d.results ?? []).slice(0, 2) })],
  'google.directions.json': [google.Directions('Toronto', 'Montreal'), trimDirections],
  'google.directions.zero_results.json': [google.Directions('Toronto', 'London, UK')],
  'gas.canada.json': [gas.CanadianGasPricesRequest()],
  'gas.province.json': [gas.CanadianGasPriceRequest('Ontario')],
  'gas.cities.json': [gas.ProvincialGasPricesRequest('Ontario')],
  'gas.usa.json': [gas.AmericanGasPricesRequest()],
  'gas.state.json': [gas.AmericanGasPriceRequest('OH')],
  'gas.state.invalid.json': [gas.AmericanGasPriceRequest('Ohio'), undefined, 400],
  'gas.international.json': [gas.WorldGasPricesRequest()],
  'fueleconomy.years.json': [fe.YearRequest()],
  'fueleconomy.makes.json': [fe.MakeRequest(2020)],
  'fueleconomy.models.json': [fe.ModelRequest(2020, 'Honda')],
  'fueleconomy.options.json': [fe.ModelOptionRequest('2020', 'Honda', 'Civic 5Dr')],
  'fueleconomy.options.single.json': [fe.ModelOptionRequest('2020', 'Tesla', 'Model 3 Long Range AWD')],
  'fueleconomy.vehicle.json': [fe.VehicleRequest('41385'), (d) => pick(d, ['id', 'year', 'make', 'model', 'trany', 'comb08', 'city08', 'highway08', 'fuelType', 'fuelType1', 'VClass'])],
};

// Optional args filter which fixtures to re-record, e.g. `node record.js gas.`
const only = process.argv.slice(2);

(async () => {
  for (const [file, [config, transform = (d) => d, expected = 200]] of Object.entries(recordings)) {
    if (only.length && !only.some((o) => file.includes(o))) continue;
    const { data, status } = await axios({ ...config, validateStatus: () => true });
    if (status !== expected) {
      console.warn(`SKIP ${file}: expected ${expected}, got ${status} (keeping existing fixture)`);
      continue;
    }
    let text = JSON.stringify(transform(data), null, 2);
    for (const s of secrets) text = text.split(s).join('REDACTED');
    fs.writeFileSync(path.join(__dirname, file), `${text}\n`);
    console.log(status, file);
  }
})();
