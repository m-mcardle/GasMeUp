const url = 'https://www.fueleconomy.gov/ws/rest';

function YearRequest() {
  return {
    method: 'get',
    url: encodeURI(`${url}/vehicle/menu/year`),
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

function MakeRequest(year) {
  return {
    method: 'get',
    url: encodeURI(`${url}/vehicle/menu/make?year=${year}`),
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

function ModelRequest(year, make) {
  return {
    method: 'get',
    url: encodeURI(`${url}/vehicle/menu/model?year=${year}&make=${make}`),
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

function ModelOptionRequest(year, make, model) {
  return {
    method: 'get',
    url: encodeURI(`${url}/vehicle/menu/options?year=${year}&make=${make}&model=${model}`),
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

function VehicleRequest(id) {
  return {
    method: 'get',
    url: encodeURI(`${url}/vehicle/${id}`),
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

module.exports = {
  YearRequest,
  MakeRequest,
  ModelRequest,
  ModelOptionRequest,
  VehicleRequest
};
