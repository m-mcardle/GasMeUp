import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import dotenv from 'dotenv';

dotenv.config();

const app = admin.initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);

const usersCollection = db.collection('Users');

// Migrate to new version
export const migrateFriendsListsUp = async () => {
  const users = await usersCollection.get();
  const batch = db.batch();

  users.forEach((user) => {
    const data = user.data();
    const oldFriends = data.friends;
    const newFriends = {};

    Object.keys(oldFriends).forEach((friend) => {
      newFriends[friend] = {
        balance: oldFriends[friend],
        accepted: true,
        status: 'accepted',
      };
    });

    console.log(oldFriends);
    console.log(newFriends);
    batch.update(user.ref, {
      friends: {
        ...newFriends,
      },
    });
  });

  await batch.commit();
};

// Migrate back
export const migrateFriendsListsDown = async () => {
  const users = await usersCollection.get();
  const batch = db.batch();

  users.forEach((user) => {
    const data = user.data();
    const oldFriends = data.friends;
    const newFriends = {};

    Object.keys(oldFriends).forEach((friend) => {
      newFriends[friend] = oldFriends[friend].balance;
    });

    console.log(oldFriends);
    console.log(newFriends);
    batch.update(user.ref, {
      friends: {
        ...newFriends,
      },
    });
  });

  await batch.commit();
};

migrateFriendsListsUp();

export default {
  migrateFriendsListsUp,
  migrateFriendsListsDown,
};
