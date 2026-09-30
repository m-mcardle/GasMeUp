const env = process.env.NODE_ENV || 'development';

function Log(...message) {
  if (env === 'development' || env === 'test') {
    console.log(...message);
  }
}

// AxiosErrors carry the full request config (URLs with `key=` params and
// X-RapidAPI-Key headers); log a summary instead so secrets never reach logs.
function redact(value) {
  if (value?.isAxiosError) {
    return `AxiosError: ${value.message} (status: ${value.response?.status ?? 'n/a'}, code: ${value.code ?? 'n/a'})`;
  }
  return value;
}

function LogError(...message) {
  console.log(...message.map(redact));
}

module.exports = { Log, LogError };
