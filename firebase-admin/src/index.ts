import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import dotenv from 'dotenv';

import { migrateFriendsListsDown, migrateFriendsListsUp } from './migrations/FriendsStructure';
import { unbreakBalances } from './migrations/BrokenBalance';
import { migrateSecureUsersTableDown, migrateSecureUsersTableUp } from './migrations/CreateSecureUsersTable';

dotenv.config();

const app = admin.initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);

if (process.argv[2] === 'up') {
  migrateFriendsListsUp(db);
} else if (process.argv[2] === 'down') {
  migrateFriendsListsDown(db);
} else if (process.argv[2] === 'secureup') {
  migrateSecureUsersTableUp(db);
} else if (process.argv[2] === 'secureupdown') {
  migrateSecureUsersTableDown(db);
} else if (process.argv[2] === 'unbreak') {
  unbreakBalances(db);
} else {
  console.log("No operation specified. Use 'up' or 'down' as argument.");
}

export default {
  db,
};
