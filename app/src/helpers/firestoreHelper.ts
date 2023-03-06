// Firebase
import {
  collection, addDoc, updateDoc, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

export async function createTransaction(transaction: Transaction) {
  await addDoc(collection(db, 'Transactions'), transaction);
}

export async function updateFriend(uid: string, friendUID: string, friend: Friend) {
  const userRef = doc(db, 'Users', uid);
  const userDoc = await getDoc(userRef);
  const user = userDoc.data();
  const userFriends = user?.friends;
  await updateDoc(doc(db, 'Users', uid), {
    friends: {
      ...userFriends,
      [friendUID]: friend,
    },
  });
}

export async function removeFriend(uid: string, friendUID: string) {
  const userRef = doc(db, 'Users', uid);
  const userDoc = await getDoc(userRef);
  const user = userDoc.data();
  const userFriends = user?.friends;
  delete userFriends[friendUID];
  await updateDoc(doc(db, 'Users', uid), {
    friends: {
      ...userFriends,
    },
  });
}

export default {
  createTransaction,
};
