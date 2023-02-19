import admin from 'firebase-admin';

interface Friend {
  balance: number,
  status: 'outgoing' | 'incoming' | 'accepted',
  accepted: boolean,
  email?: string
}

// Migrate to new version
export const unbreakBalances = async (db: admin.firestore.Firestore) => {
  const usersCollection = db.collection('Users');

  const users = await usersCollection.get();
  const batch = db.batch();

  users.forEach((user) => {
    const data = user.data();
    const oldFriends = data.friends;
    const newFriends: Record<string, Friend> = {};

    Object.keys(oldFriends).forEach((friend) => {
      newFriends[friend] = {
        balance: oldFriends[friend].balance.balance,
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

export default {
  unbreakBalances,
};
