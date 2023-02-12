const KM_TO_MILES = 0.621371;
export const convertKMtoMiles = (km: number) => km * KM_TO_MILES;
export const convertMilesToKM = (miles: number) => miles / KM_TO_MILES;

const L_TO_GALLONS = 0.264172;
export const convertLtoGallons = (l: number) => l * L_TO_GALLONS;
export const convertGallonsToL = (gallons: number) => gallons / L_TO_GALLONS;

export const convertFuelEfficiency = (fuel: number) => 235.214583 / fuel;

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

export function convertAll(
  distance: number,
  fuelEfficiency: number,
  gasPrice: number,
  inputCountry: 'CA' | 'US',
  outputCountry: 'CA' | 'US',
) {
  // Distance and fuel are always in KM and L/100KM (for now)
  return {
    distance: convertKMtoMiles(distance),
    fuelEfficiency: convertFuelEfficiency(fuelEfficiency),
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
