import admin from 'firebase-admin';

// Migrate to new version
export const migrateFriendsListsUp = async (db: admin.firestore.Firestore) => {
  const usersCollection = db.collection('Users');

  const users = await usersCollection.get();
  const batch = db.batch();

  users.forEach((user) => {
    const data = user.data();
    const oldFriends = data.friends;
    const newFriends: Record<string, Friend> = {};

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
export const migrateFriendsListsDown = async (db: admin.firestore.Firestore) => {
  const usersCollection = db.collection('Users');

  const users = await usersCollection.get();
  const batch = db.batch();

  users.forEach((user) => {
    const data = user.data();
    const oldFriends = data.friends;
    const newFriends: Record<string, Friend> = {};

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

export default {
  migrateFriendsListsUp,
  migrateFriendsListsDown,
};
