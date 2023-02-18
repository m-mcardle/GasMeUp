import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import dotenv from 'dotenv';

dotenv.config();

const app = admin.initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);

export default {
  db,
};
