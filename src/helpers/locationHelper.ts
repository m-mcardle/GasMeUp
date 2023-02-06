export const provinceCodes: Record<string, string> = {
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

export const provinces = Object.values(provinceCodes);

export const lookupProvince = (code: string) => provinceCodes[code] ?? 'Ontario';

export default { provinceCodes, lookupProvince, provinces };
