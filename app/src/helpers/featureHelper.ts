import remoteConfig from '@react-native-firebase/remote-config';

const defaultValues = {
  exchange_rate: 0.7,
  fetch_exchange_rate: false,
  manual_trip_tracking: false,
};

export const initializeRemoteConfig = async () => {
  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: 3000,
  });
  await remoteConfig().setDefaults(defaultValues);
  const response = await remoteConfig().fetchAndActivate();
  console.log('Remote config initialized: ', response);
  return response;
};

export const isFeatureEnabled = (feature: string) => {
  const enabled = remoteConfig().getValue(feature);
  return enabled.asBoolean();
};

export const getConfig = (feature: string) => {
  const config = remoteConfig().getValue(feature);
  return config.asString();
};

export const getNumberConfig = (feature: string) => {
  const config = remoteConfig().getValue(feature);
  return config.asNumber();
};

export const getAllFeatures = () => {
  const features = remoteConfig().getAll();
  return features;
};

export default {
  initializeRemoteConfig,
  isFeatureEnabled,
  getAllFeatures,
  getConfig,
  getNumberConfig,
};
