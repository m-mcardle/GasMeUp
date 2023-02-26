import { ENV } from './env';

export async function getExchangeRate() {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${ENV.EXCHANGE_RATE_API_KEY}/pair/CAD/USD`);
    const json = await response.json();
    if (json.result !== 'success') {
      throw new Error('Failed to get exchange rate');
    }
    return json.conversion_rate ?? 1;
  } catch (ex) {
    console.error(ex);
    return 1;
  }
}

const KM_TO_MILES = 0.621371;
export const convertKMtoMiles = (km: number) => km * KM_TO_MILES;
export const convertMilesToKM = (miles: number) => miles / KM_TO_MILES;

const L_TO_GALLONS = 0.264172;
export const convertLtoGallons = (l: number) => l * L_TO_GALLONS;
export const convertGallonsToL = (gallons: number) => gallons / L_TO_GALLONS;

export const convertFuelEfficiency = (fuel: number, inputCountry: 'CA' | 'US' = 'US', outputCountry: 'CA' | 'US' = 'CA') => {
  if (inputCountry === outputCountry) {
    return fuel;
  }

  return Number((235.214583 / fuel).toFixed(2));
};

export const convertFuelEfficiencyToString = (fuel: number, inputCountry: 'CA' | 'US' = 'US', outputCountry: 'CA' | 'US' = 'CA') => {
  const convertedFuel = convertFuelEfficiency(fuel, inputCountry, outputCountry);
  const units = outputCountry === 'CA' ? 'L/100km' : 'mpg';
  return `${convertedFuel} ${units}`;
};

export const convertDollarsPerGalToDollarsPerL = (dollar: number) => dollar * 4.54609;
export const convertDollarsPerLToDollarsPerGal = (dollar: number) => dollar / 4.54609;

export const convertGasPrice = (price: number, inputCountry: 'CA' | 'US', outputCountry: 'CA' | 'US') => {
  if (inputCountry === outputCountry) {
    return price;
  }
  if (inputCountry === 'CA' && outputCountry === 'US') {
    return convertGallonsToL(price);
  }
  if (inputCountry === 'US' && outputCountry === 'CA') {
    return convertLtoGallons(price);
  }
  return price;
};

export const convertGasPriceToString = (price: number, inputCountry: 'CA' | 'US', outputCountry: 'CA' | 'US') => {
  const convertedPrice = convertGasPrice(price, inputCountry, outputCountry);
  const units = outputCountry === 'CA' ? '/L' : '/gal';
  return `$${convertedPrice.toFixed(2)}${units}`;
};

export function convertAll(
  distance: number,
  fuelEfficiency: number,
  gasPrice: number,
  inputCountry: 'CA' | 'US',
  outputCountry: 'CA' | 'US',
) {
  const convertToUS = outputCountry === 'US';
  // Distance and fuel are always in KM and L/100KM (for now)
  return {
    distance: convertToUS ? convertKMtoMiles(distance) : distance,
    fuelEfficiency: convertToUS ? convertFuelEfficiency(fuelEfficiency, 'CA', 'US') : fuelEfficiency,
    gasPrice: convertGasPrice(gasPrice, inputCountry, outputCountry),
  };
}

export function convertAllToString(
  distance: number,
  fuelEfficiency: number,
  gasPrice: number,
  inputCountry: 'CA' | 'US',
  outputCountry: 'CA' | 'US',
) {
  const {
    distance: distanceConverted,
    fuelEfficiency: fuelEfficiencyConverted,
    gasPrice: gasPriceConverted,
  } = convertAll(
    distance,
    fuelEfficiency,
    gasPrice,
    inputCountry,
    outputCountry,
  );

  return {
    distance: `${distanceConverted.toFixed(2)} ${outputCountry === 'CA' ? 'km' : 'mi'}`,
    fuelEfficiency: `${fuelEfficiencyConverted.toFixed(1)} ${outputCountry === 'CA' ? 'L/100km' : 'mpg'}`,
    gasPrice: `$${gasPriceConverted.toFixed(2)}${outputCountry === 'CA' ? '/L' : '/gal'}`,
  };
}

export default {
  convertKMtoMiles,
  convertMilesToKM,
  convertLtoGallons,
  convertGallonsToL,
  convertFuelEfficiency,
  convertDollarsPerGalToDollarsPerL,
  convertDollarsPerLToDollarsPerGal,
  convertGasPrice,
};
