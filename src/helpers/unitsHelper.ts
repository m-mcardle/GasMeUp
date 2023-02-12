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
