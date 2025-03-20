import { getRemoteConfig } from '@react-native-firebase/remote-config';

import defaultValues from '../data/remote_config_defaults.json';

import { DEV } from './env';

const remoteConfig = getRemoteConfig();

export const initializeRemoteConfig = async () => {
  await remoteConfig.activate();
  await remoteConfig.setConfigSettings({
    minimumFetchIntervalMillis: (DEV ? 60000 : 3600000), // 1h if production, 1m if development
  });
  await remoteConfig.setDefaults(defaultValues);
  const response = await remoteConfig.fetchAndActivate();
  console.log('Remote config initialized:', response);
  return response;
};

export const isFeatureEnabled = (feature: string) => {
  const enabled = remoteConfig.getValue(feature);
  return enabled.asBoolean();
};

export const getConfig = (feature: string) => {
  const config = remoteConfig.getValue(feature);
  return config.asString();
};

export const getNumberConfig = (feature: string) => {
  const config = remoteConfig.getValue(feature);
  return config.asNumber();
};

export const getAllFeatures = () => {
  const features = remoteConfig.getAll();
  return features;
};

export default {
  initializeRemoteConfig,
  isFeatureEnabled,
  getAllFeatures,
  getConfig,
  getNumberConfig,
};
