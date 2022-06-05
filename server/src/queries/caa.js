// Request to fetch webpage that contains current gas prices
function FetchWebpage() {
  return {
    method: 'get',
    url: encodeURI('https://www.caa.ca/gas-prices/'),
  };
}

// Scrapes webpage to extract price for a given province
function RetrieveProvincePrice(document, province) {
  const rows = document.querySelector('tbody').querySelectorAll('tr');

  let provincePrice;
  rows.forEach((row) => {
    if (row.textContent.includes(province)) {
      provincePrice = row.querySelector('td.caa_gas_price').textContent;
    }
  });
  const price = Number(provincePrice.slice(0, -2)) / 100;
  return price;
}

// Scrapes webpage to extract prices for all provinces
function RetreiveAllPrices(document) {
  const rows = document.querySelector('tbody').querySelectorAll('tr');

  const prices = [];
  rows.forEach((row) => {
    const provinceName = row.querySelector('td.caa_gas_city').textContent;
    const provincePrice = row.querySelector('td.caa_gas_price').textContent;
    const price = Number(provincePrice.slice(0, -2)) / 100;
    prices.push({ province: provinceName, price });
  });
  return prices;
}

module.exports = { FetchWebpage, RetreiveAllPrices, RetrieveProvincePrice };
