import {
  activate,
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  getValue,
} from '@react-native-firebase/remote-config';

import defaultValues from '../data/remote_config_defaults.json';

const remoteConfig = getRemoteConfig();

export const initializeRemoteConfig = async () => {
  await activate(remoteConfig);
  // Modular (firebase-js-sdk style) API: settings and defaults are assigned as properties.
  // They apply to the JS instance immediately and are forwarded to native in call order.
  remoteConfig.settings = {
    ...remoteConfig.settings,
    minimumFetchIntervalMillis: 3600000, // 1 hour
  };
  remoteConfig.defaultConfig = defaultValues;
  const response = await fetchAndActivate(remoteConfig);
  console.log('Remote config initialized:', response);
  return response;
};

// Until initializeRemoteConfig() has run (e.g. the first render of a fresh install),
// Remote Config has no values at all and every key reads as the static false/''/0.
// Fall back to the bundled defaults so the first render matches them.
const getString = (feature: string) => {
  const value = getValue(remoteConfig, feature);
  if (value.getSource() === 'static' && feature in defaultValues) {
    return (defaultValues as Record<string, string>)[feature];
  }
  return value.asString();
};

const BOOLEAN_TRUE = ['1', 'true', 't', 'yes', 'y', 'on'];

export const isFeatureEnabled = (feature: string) => (
  BOOLEAN_TRUE.includes(getString(feature).toLowerCase())
);

export const getConfig = (feature: string) => getString(feature);

export const getNumberConfig = (feature: string) => Number(getString(feature)) || 0;

export const getAllFeatures = () => getAll(remoteConfig);

export default {
  initializeRemoteConfig,
  isFeatureEnabled,
  getAllFeatures,
  getConfig,
  getNumberConfig,
};
