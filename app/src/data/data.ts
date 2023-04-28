import { ENV } from '../helpers/env';
import { getConfig } from '../helpers/featureHelper';

// Helper method to easily fetch API data
// Example:
// route = '/suggestion'
// params = { input: 'Waterloo' }
export async function fetchData(
  route: string,
  params: Record<string, string | undefined> = {},
) {
  const serverUrl = ENV.USE_DEV_API === 'true' && ENV.DEV_API_URL
    ? ENV.DEV_API_URL
    : getConfig('server_url');

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
};
