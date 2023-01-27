// React
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, addDoc, DocumentData, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Text from '../Text';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import Button from '../Button';

const transactionsRef = collection(db, 'Transactions');

interface Props {
  uid: string,
  name: string,
  amount: number,
  close: Function,
}

export default function FriendInfoSection({
  uid, name, amount, close,
}: Props) {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser?.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  // Query for transactions involving he current user
  const transactionsQuery = userDocument?.transactions.length > 0
    ? query(transactionsRef, where('users', 'array-contains', currentUser?.uid))
    : undefined;
  const [transactionsData] = useCollectionData(transactionsQuery);

  // Filter transactions to only include transactions involving the selected friend
  const filteredTransactions = transactionsData
    ?.filter((transaction: DocumentData) => transaction.users.includes(uid));

  const settleUp = useCallback(async () => {
    if (!currentUser?.uid) {
      return;
    }
    try {
      await addDoc(collection(db, 'Transactions'), {
        amount: amount * -1,
        payeeUID: currentUser.uid,
        payerUID: uid,
        date: new Date(),
        users: [currentUser.uid, uid],
        type: 'settle',
      });
      close();
    } catch (exception) {
      console.log(exception);
    }
  }, [uid, name, amount, currentUser?.uid]);

  const removeFriend = useCallback(async () => {
    if (!currentUser?.uid || !userDoc) {
      return;
    }
    try {
      const newFriendsList = userDocument?.friends;
      delete newFriendsList[uid];

      await updateDoc(userDoc, {
        friends: {
          ...newFriendsList,
        },
      });
      close();
    } catch (exception) {
      console.log(exception);
    }
  }, [uid, userDocument, userDoc, currentUser?.uid]);

  const showConfirmationAlert = () => Alert.alert(
    'Remove Friend',
    'Are you sure you want to remove this friend?',
    [
      {
        text: 'OK',
        onPress: () => removeFriend(),
        style: 'default',
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
  );

  // Sort transactions by date, and then only show the transactions since the last `settle`
  const sortedTransactions = filteredTransactions
    ?.sort((a, b) => b.date.toDate() - a.date.toDate())
    ?? [];
  const lastSettleIndex = sortedTransactions.findIndex((transaction: DocumentData) => transaction.type === 'settle');
  const transactionsSinceLastSettle = lastSettleIndex !== -1
    ? sortedTransactions.slice(0, lastSettleIndex)
    : sortedTransactions;

  return (
    <View style={{ height: '100%' }}>
      <Button
        style={styles.deleteFriendButton}
        onPress={showConfirmationAlert}
      >
        <Ionicons name="close" size={24} color="white" />
      </Button>
      <Text style={styles.friendInfoTitle}>{name}</Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Amount</DataTable.Title>
          <DataTable.Title numeric>Date</DataTable.Title>
        </DataTable.Header>

        {transactionsSinceLastSettle?.map((transaction) => (
          <DataTable.Row key={transaction.payeeUID + transaction.amount + transaction.date}>
            <DataTable.Cell>
              {`$${transaction.amount * (transaction.payeeUID === currentUser?.uid ? 1 : -1)}`}
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {transaction.date.toDate().toLocaleDateString()}
            </DataTable.Cell>
          </DataTable.Row>
        ))}

        <DataTable.Row>
          <DataTable.Cell>
            Total
          </DataTable.Cell>
          <DataTable.Cell numeric>
            {`$${amount.toFixed(2)}`}
          </DataTable.Cell>
        </DataTable.Row>
      </DataTable>

      <View style={styles.friendInfoButtonSection}>
        <Button
          style={styles.friendInfoButton}
          disabled={amount === 0}
          onPress={settleUp}
        >
          <Text style={{ color: 'white' }}>Settle Up</Text>
        </Button>
      </View>
    </View>
  );
}
