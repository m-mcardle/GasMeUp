const validateAPIKey = (apiKey) => apiKey === process.env.CLIENT_API_KEY;

module.exports = {
  validateAPIKey,
};
