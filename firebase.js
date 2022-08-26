import AsyncStorage from '@react-native-async-storage/async-storage';

import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDxBb15kMpTmnBMr1tSIa7bAPMO7UJY8AY',
  authDomain: 'northern-bot-301518.firebaseapp.com',
  projectId: 'northern-bot-301518',
  storageBucket: 'northern-bot-301518.appspot.com',
  messagingSenderId: '888451573881',
  appId: '1:888451573881:web:d4367d2d9c85c4d8b78ca8',
  measurementId: 'G-57EGQKLV9R',
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
