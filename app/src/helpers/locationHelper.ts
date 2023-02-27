export const provinceCodeLookup: Record<string, string> = {
  ON: 'Ontario',
  QC: 'Quebec',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  PE: 'Prince Edward Island',
  BC: 'British Columbia',
  AB: 'Alberta',
  SK: 'Saskatchewan',
  MB: 'Manitoba',
  // Territories are not supported
  // YT: 'Yukon',
  // NT: 'Northwest Territories',
  // NU: 'Nunavut',
};

export const stateCodeLookup: Record<string, string> = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
};

export const provinces = Object.values(provinceCodeLookup);
export const provinceCodes = Object.keys(provinceCodeLookup);
export const states = Object.values(stateCodeLookup);
export const stateCodes = Object.keys(stateCodeLookup);

export const lookupProvince = (code: string) => provinceCodeLookup[code] ?? 'Ontario';
export const lookupState = (code: string) => stateCodeLookup[code] ?? 'New York';

export const lookupStateCode = (state: string) => {
  const code = Object.keys(stateCodeLookup).find((key) => stateCodeLookup[key] === state);
  return code ?? 'NY';
};

export default {
  provinceCodeLookup,
  lookupProvince,
  provinces,
};
