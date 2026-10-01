const crypto = require('crypto');

// The client API key identifies the GasMeUp app; it ships inside the app bundle,
// so treat it as an app identifier rather than a secret.
//
// Preferred transport is the `x-api-key` header, which keeps it out of request
// URLs (and therefore out of App Engine request logs). The `api_key` query param
// is still accepted so already-shipped app builds keep working.
const API_KEY_HEADER = 'x-api-key';

const validateAPIKey = (apiKey) => {
  const expected = process.env.CLIENT_API_KEY;
  // A missing server key must never let key-less requests through.
  if (!expected || typeof apiKey !== 'string' || !apiKey) return false;
  const a = Buffer.from(apiKey);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const apiKeyFromRequest = (req) => {
  const header = req.get?.(API_KEY_HEADER);
  if (header) return header;
  const query = req.query?.api_key;
  return typeof query === 'string' ? query : undefined;
};

const validateRequest = (req) => validateAPIKey(apiKeyFromRequest(req));

module.exports = {
  API_KEY_HEADER,
  validateAPIKey,
  apiKeyFromRequest,
  validateRequest,
};
