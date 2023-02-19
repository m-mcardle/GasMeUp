import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import dotenv from 'dotenv';

import { migrateFriendsListsDown, migrateFriendsListsUp } from './migrations/FriendsStructure';

dotenv.config();

const app = admin.initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);

if (process.argv[2] === 'up') {
  migrateFriendsListsUp(db);
} else if (process.argv[2] === 'down') {
  migrateFriendsListsDown(db);
} else {
  console.log("No operation specified. Use 'up' or 'down' as argument.");
}

export default {
  db,
};
