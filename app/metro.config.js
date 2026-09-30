const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Never bundle the sibling backend packages of this repo (they are not app code).
// Anchored to the repo root so unrelated node_modules paths such as
// `.../functions/...` or `.../server/...` are not blocked.
const repoRoot = path.resolve(__dirname, '..');
const escapeRegExp = (value) => value.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
config.resolver.blockList = ['firebase-admin', 'functions', 'server'].map(
  (dir) => new RegExp(`^${escapeRegExp(path.join(repoRoot, dir))}\\/.*$`),
);

module.exports = config;
