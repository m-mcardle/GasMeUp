// Test HTTP server + env isolation helpers for the hermetic suites.
//
// Why not `supertest(app)`? For a bare app, supertest calls `app.listen(0)`, which
// binds the IPv6 wildcard `::`, then rewrites the address to 127.0.0.1. On macOS
// a `::` socket can be handed an ephemeral port that another process already
// holds on 127.0.0.1 (IDE helpers, Ollama, OrbStack, other dev servers...), so
// the request silently goes to THAT process: random 404s, 401s and
// "socket hang up". Binding 127.0.0.1 explicitly makes the OS pick a port that
// is free on the exact address supertest connects to.
const supertest = require('supertest');

//
// listen() with a host is asynchronous, and supertest re-listens on `::` if the
// server has no address yet, so wait for 'listening' before creating the agent.
// Returns a lazy stand-in for `supertest(server)`: request.get(...), .post(...), ...
const { once } = require('events');

function startServer(app) {
  let server;
  let agent;
  beforeAll(async () => {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    agent = supertest(server);
  });
  afterAll(() => new Promise((resolve) => { server.close(() => resolve()); }));
  return new Proxy({}, {
    get: (_target, method) => (...args) => {
      if (!agent) throw new Error('Test server is not listening yet (use request.* inside tests/hooks)');
      return agent[method](...args);
    },
  });
}

// Snapshot process.env before each test and restore it exactly afterwards, so a
// test that deletes or overrides a variable can never affect the next test.
function isolateEnv() {
  let saved;
  beforeEach(() => { saved = { ...process.env }; });
  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in saved)) delete process.env[key];
    });
    Object.assign(process.env, saved);
  });
}

module.exports = { startServer, isolateEnv };
