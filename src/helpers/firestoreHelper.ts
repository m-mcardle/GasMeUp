// Firebase
import {
  collection, addDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

export async function createTransaction(transaction: Transaction) {
  await addDoc(collection(db, 'Transactions'), transaction);
}

export default {
  createTransaction,
};
