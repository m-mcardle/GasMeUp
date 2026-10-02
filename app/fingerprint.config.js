// Fingerprint (runtime version) configuration.
//
// The runtime version is a hash of everything that affects native compatibility.
// Some app config values come from environment variables that legitimately differ
// between a local machine and EAS (EAS secrets vs. a developer's .env), so hashing
// them makes the locally computed runtime version disagree with the one computed on
// EAS, which fails the build. None of them change native compatibility:
//  - `extra`: runtime JS config (API URLs, public keys), read via expo-constants.
//  - the react-native-maps iOS API key: a value baked into Info.plist, not native code.
const { SourceSkips } = require('@expo/fingerprint');

module.exports = {
  sourceSkips: SourceSkips.ExpoConfigExtraSection,
  fileHookTransform: (source, chunk) => {
    if (source.type === 'contents' && source.id === 'expoConfig' && typeof chunk === 'string') {
      return chunk.replace(/"iosGoogleMapsApiKey":"[^"]*"/g, '"iosGoogleMapsApiKey":""');
    }
    return chunk;
  },
};
