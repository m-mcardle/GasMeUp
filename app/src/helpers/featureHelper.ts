import remoteConfig from '@react-native-firebase/remote-config';

export const initializeRemoteConfig = async () => {
  const response = await remoteConfig().fetchAndActivate();
  console.log('Remote config initialized: ', response);
  return response;
};

export const isFeatureEnabled = (feature: string) => {
  const enabled = remoteConfig().getValue(feature);
  return enabled.asBoolean();
};

export default {
  initializeRemoteConfig,
  isFeatureEnabled,
};
