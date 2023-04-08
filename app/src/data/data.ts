import { ENV } from '../helpers/env';

export const serverUrl = ENV.USE_DEV_API === 'true' && ENV.DEV_API_URL
  ? ENV.DEV_API_URL
  : 'https://gasmeup-7ce5f.uc.r.appspot.com/';

// Helper method to easily fetch API data
// Example:
// route = '/suggestion'
// params = { input: 'Waterloo' }
export async function fetchData(
  route: string,
  params: Record<string, string | undefined> = {},
) {
  const url = new URL(`${serverUrl + route}`);
  url.searchParams.append('api_key', ENV.API_KEY);
  Object.keys(params).forEach((param) => {
    if (params[param]) {
      url.searchParams.append(param, params[param]!);
    }
  });
  return fetch(url.toString());
}

export default {
  fetchData,
  serverUrl,
};
