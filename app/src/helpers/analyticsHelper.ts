import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logLogin as firebaseLogLogin,
  logScreenView as firebaseLogScreenView,
  logSignUp as firebaseLogSignUp,
} from '@react-native-firebase/analytics';

const analytics = getAnalytics();

export const logEvent = (name: string, params?: any) => {
  console.log('logEvent', name, params ?? '');
  firebaseLogEvent(analytics, name, params);
};

export const logScreenView = (screenName: string) => {
  console.log('logScreenView', screenName);
  firebaseLogScreenView(analytics, {
    screen_name: screenName,
    screen_class: screenName,
  });
};

export const logSignUp = (method: string) => {
  console.log('logSignUp', method);
  firebaseLogSignUp(analytics, {
    method,
  });
};

export const logLogin = (method: string) => {
  console.log('logLogin', method);
  firebaseLogLogin(analytics, {
    method,
  });
};

export default analytics;
