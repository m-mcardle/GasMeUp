import { DEV, ENV } from '../helpers/env';
import { getConfig } from '../helpers/featureHelper';

function serverUrl() {
  // The dev API override only applies to development builds; release builds always use the
  // Remote Config server URL, even if USE_DEV_API leaks into a production environment.
  return DEV && ENV.USE_DEV_API === 'true' && ENV.DEV_API_URL
    ? ENV.DEV_API_URL
    : getConfig('server_url');
}

// The server identifies the app by this header. (Older builds sent it as the
// `api_key` query param, which the server still accepts; the header keeps it out
// of request URLs and server logs.)
function apiHeaders(): Record<string, string> {
  return { 'x-api-key': ENV.API_KEY ?? '' };
}

// Helper method to easily fetch API data
// Example:
// route = '/suggestion'
// params = { input: 'Waterloo' }
export async function fetchData(
  route: string,
  params: Record<string, string | undefined> = {},
) {
  const url = new URL(`${serverUrl() + route}`);
  Object.keys(params).forEach((param) => {
    if (params[param]) {
      url.searchParams.append(param, params[param]!);
    }
  });
  return fetch(url.toString(), { headers: apiHeaders() });
}

// POST a JSON body to the API.
export async function postData(route: string, body: Record<string, unknown>) {
  return fetch(`${serverUrl() + route}`, {
    method: 'POST',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export default {
  fetchData,
  postData,
};
