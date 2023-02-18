import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';

import { getFirestore } from 'firebase/firestore';

const DEVELOPMENT = process.env.NODE_ENV === 'development';
console.log('Firebase environment:', DEVELOPMENT ? 'development' : 'production');

const firebaseConfig = DEVELOPMENT
  ? {
    apiKey: Constants.expoConfig.extra.firebaseAPIKey,
    authDomain: 'northern-bot-301518.firebaseapp.com',
    projectId: 'northern-bot-301518',
    storageBucket: 'northern-bot-301518.appspot.com',
    messagingSenderId: '888451573881',
    appId: '1:888451573881:web:d4367d2d9c85c4d8b78ca8',
    measurementId: 'G-57EGQKLV9R',
  }
  : {
    apiKey: Constants.expoConfig.extra.prodFirebaseAPIKey,
    authDomain: 'gasmeup-7ce5f.firebaseapp.com',
    projectId: 'gasmeup-7ce5f',
    storageBucket: 'gasmeup-7ce5f.appspot.com',
    messagingSenderId: '75759268664',
    appId: '1:75759268664:web:5a77f78f85848bc87dc7cd',
    measurementId: 'G-ZCJDGZ76RR',
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Needed to fix `AsyncStorage has been extracted from react-native core` warning
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore();

export default {
  app,
  auth,
  db,
};
