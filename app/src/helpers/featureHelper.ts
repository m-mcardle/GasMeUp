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

export const isFeatureEnabled = (feature: string) => getValue(remoteConfig, feature).asBoolean();

export const getConfig = (feature: string) => getValue(remoteConfig, feature).asString();

export const getNumberConfig = (feature: string) => getValue(remoteConfig, feature).asNumber();

export const getAllFeatures = () => getAll(remoteConfig);

export default {
  initializeRemoteConfig,
  isFeatureEnabled,
  getAllFeatures,
  getConfig,
  getNumberConfig,
};
