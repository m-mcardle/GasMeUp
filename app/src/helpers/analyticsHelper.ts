import analyticsModule from '@react-native-firebase/analytics';

const analytics = analyticsModule();

export const logEvent = (name: string, params?: any) => {
  console.log('logEvent', name, params ?? '');
  analytics.logEvent(name, params);
};

export const logScreenView = (screenName: string) => {
  console.log('logScreenView', screenName);
  analytics.logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
};

export const logSignUp = (method: string) => {
  console.log('logSignUp', method);
  analytics.logSignUp({
    method,
  });
};

export const logLogin = (method: string) => {
  console.log('logLogin', method);
  analytics.logLogin({
    method,
  });
};

export default analytics;
