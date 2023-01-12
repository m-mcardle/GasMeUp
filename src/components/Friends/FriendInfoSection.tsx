// React
import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, addDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Text from '../Text';

// Styles
import styles from '../../styles/FriendsScreen.styles';

const transactionsRef = collection(db, 'Transactions');

interface Props {
  uid: string,
  name: string,
  amount: number,
}

export default function FriendInfoSection({ uid, name, amount }: Props) {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser?.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  // Query for transactions involving he current user and the `uid` user
  const transactionsQuery = userDocument?.transactions.length > 0
    ? query(transactionsRef, where('__name__', 'in', userDocument?.transactions), where('users', 'array-contains', uid))
    : undefined;
  const [transactionsData] = useCollectionData(transactionsQuery);

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
    } catch (exception) {
      console.log(exception);
    }
  }, [uid, name, amount, currentUser?.uid]);

  return (
    <View>
      <Text style={styles.friendInfoTitle}>{name}</Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Amount</DataTable.Title>
          <DataTable.Title numeric>Date</DataTable.Title>
        </DataTable.Header>

        {transactionsData?.map((transaction) => (
          <DataTable.Row key={transaction.payeeUID + transaction.amount + transaction.date}>
            <DataTable.Cell>
              {`$${transaction.amount * (transaction.payeeUID === currentUser?.uid ? 1 : -1)}`}
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {transaction.date.toDate().toLocaleDateString()}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      <View style={styles.friendInfoButtonSection}>
        <TouchableOpacity
          style={styles.friendInfoButton}
          onPress={settleUp}
        >
          <Text style={{ color: 'black' }}>Settle Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
