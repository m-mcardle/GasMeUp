// Splitwise OAuth 2 (authorization code grant, optionally with PKCE).
//
// The consumer secret must never ship in the mobile app, so the app sends the
// authorization code here and this server performs the code -> token exchange.
//
// Two Splitwise apps are supported (the mobile app picks one by build type):
//   SPLITWISE_CLIENT_ID     / SPLITWISE_CONSUMER_SECRET      (production app)
//   DEV_SPLITWISE_CLIENT_ID / DEV_SPLITWISE_CONSUMER_SECRET  (development app, optional)
// The request's `client_id` selects which secret is used; unknown IDs are rejected.

const SPLITWISE_TOKEN_URL = 'https://secure.splitwise.com/oauth/token';

function splitwiseClients() {
  const clients = {};
  const add = (id, secret) => {
    if (id && secret) clients[id] = secret;
  };
  add(process.env.SPLITWISE_CLIENT_ID, process.env.SPLITWISE_CONSUMER_SECRET);
  add(process.env.DEV_SPLITWISE_CLIENT_ID, process.env.DEV_SPLITWISE_CONSUMER_SECRET);
  return clients;
}

function SplitwiseTokenRequest({
  clientId, clientSecret, code, redirectUri, codeVerifier,
}) {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) form.set('code_verifier', codeVerifier);

  return {
    method: 'POST',
    url: SPLITWISE_TOKEN_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    data: form.toString(),
    timeout: 15000,
  };
}

module.exports = {
  SPLITWISE_TOKEN_URL,
  splitwiseClients,
  SplitwiseTokenRequest,
};
