const env = process.env.NODE_ENV || 'development';

function Log(...message) {
  if (env === 'development') {
    console.log(...message);
  }
}

function LogError(...message) {
  console.log(...message);
}

module.exports = { Log, LogError };
