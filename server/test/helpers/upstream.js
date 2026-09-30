// Fake upstream for the hermetic suite: maps an axios request config (as built by
// src/queries/*) to a recorded fixture from test/fixtures. Unknown URLs throw so a
// new outbound call can never silently reach the network.
const { AxiosError } = jest.requireActual('axios');

const fixture = (name) => structuredClone(require(`../fixtures/${name}.json`));

function httpError(config, status, data) {
  const response = { status, statusText: String(status), data, headers: {}, config };
  return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response);
}

function resolve(config) {
  const url = new URL(config.url);
  const q = url.searchParams;
  const { host, pathname } = url;

  if (host === 'maps.googleapis.com') {
    if (pathname.endsWith('/place/autocomplete/json')) return fixture('google.autocomplete');
    if (pathname.endsWith('/place/details/json')) return fixture('google.place');
    if (pathname.endsWith('/geocode/json')) return fixture('google.geocode');
    if (pathname.endsWith('/directions/json')) {
      return q.get('destination') === 'London, UK'
        ? fixture('google.directions.zero_results')
        : fixture('google.directions');
    }
  }

  if (host === 'canadian-gas-prices.p.rapidapi.com') {
    switch (pathname) {
      case '/canada': return fixture('gas.canada');
      case '/province': return fixture('gas.province');
      case '/cities': return fixture('gas.cities');
      case '/usa': return fixture('gas.usa');
      case '/international': return fixture('gas.international');
      case '/state':
        if (q.get('state')?.length !== 2) throw httpError(config, 400, fixture('gas.state.invalid'));
        return fixture('gas.state');
      default:
    }
  }

  if (host === 'www.fueleconomy.gov') {
    if (pathname.endsWith('/vehicle/menu/year')) return fixture('fueleconomy.years');
    if (pathname.endsWith('/vehicle/menu/make')) return fixture('fueleconomy.makes');
    if (pathname.endsWith('/vehicle/menu/model')) return fixture('fueleconomy.models');
    if (pathname.endsWith('/vehicle/menu/options')) {
      return q.get('make') === 'Tesla' ? fixture('fueleconomy.options.single') : fixture('fueleconomy.options');
    }
    if (/\/vehicle\/\d+$/.test(pathname)) return fixture('fueleconomy.vehicle');
  }

  throw new Error(`Hermetic test made an unexpected outbound request: ${config.method} ${config.url}`);
}

// Mimics the axios instance returned by axios.create(): callable with a config.
const api = jest.fn(async (config) => ({ status: 200, data: resolve(config), config }));

module.exports = { api, httpError, fixture };
