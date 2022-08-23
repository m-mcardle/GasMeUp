// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBBVObo9HBuNdC_rTo-UYBdvf5aU_l0hvA',
  authDomain: 'northern-bot-301518.firebaseapp.com',
  projectId: 'northern-bot-301518',
  storageBucket: 'northern-bot-301518.appspot.com',
  messagingSenderId: '888451573881',
  appId: '1:888451573881:web:d4367d2d9c85c4d8b78ca8',
  measurementId: 'G-57EGQKLV9R',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();

// Listen for authentication state to change.
onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log('We are authenticated now!');
  }

  // Do other things
});

export default {
  app,
  auth,
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
};
