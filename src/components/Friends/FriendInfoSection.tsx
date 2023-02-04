// React
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { DataTable, Modal, Portal } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, addDoc, DocumentData, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Text from '../Text';
import Button from '../Button';
import MapContainer from '../MapContainer';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors, boldFont, globalStyles } from '../../styles/styles';

// Helpers
import { locationToLatLng } from '../../helpers/mapHelper';

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
  const [visible, setVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<DocumentData>({});

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

  const transactionWaypoints = selectedTransaction.waypoints ?? [];
  return (
    <View style={{ height: '100%' }}>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
        >
          <View style={globalStyles.miniModal}>
            {transactionWaypoints.length > 0 && (
              <MapContainer
                data={{
                  start: {
                    ...locationToLatLng(transactionWaypoints[0]),
                  },
                  end: {
                    ...locationToLatLng(transactionWaypoints[transactionWaypoints.length - 1]),
                  },
                }}
                showUserLocation={false}
                waypoints={transactionWaypoints}
              />
            )}
          </View>
        </Modal>
      </Portal>
      <Button
        style={styles.deleteFriendButton}
        onPress={showConfirmationAlert}
      >
        <Ionicons name="close" size={24} color="white" />
      </Button>
      <Text style={styles.friendInfoTitle}>{name}</Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ maxWidth: '8%' }}> </DataTable.Title>
          <DataTable.Title style={{ minWidth: '30%' }}>Start/End</DataTable.Title>
          <DataTable.Title numeric>Date</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
        </DataTable.Header>

        <ScrollView style={{ maxHeight: 300 }}>
          {transactionsSinceLastSettle?.map((transaction) => (
            <DataTable.Row key={transaction.payeeUID + transaction.amount + transaction.date}>
              <DataTable.Cell
                style={{ maxWidth: '8%' }}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setVisible(true);
                }}
                disabled={!(transaction?.waypoints?.length > 0)}
              >
                {transaction?.waypoints?.length > 0 && <Ionicons name="map" size={12} color={colors.action} />}
              </DataTable.Cell>
              <DataTable.Cell style={{ minWidth: '30%' }}>
                <View style={{ justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10 }}>
                    {`Start: ${(transaction.startLocation.length > 20 ? `${transaction.startLocation.substring(0, 20)}...` : transaction.startLocation)}`}
                  </Text>
                  <Text style={{ fontSize: 10, paddingTop: 4 }}>
                    {`End: ${(transaction.endLocation.length > 20 ? `${transaction.endLocation.substring(0, 20)}...` : transaction.endLocation)}`}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ fontSize: 10 }} numeric>
                {transaction.date.toDate().toLocaleDateString()}
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ fontSize: 10 }} numeric>
                {`$${transaction.amount * (transaction.payeeUID === currentUser?.uid ? 1 : -1)}`}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </ScrollView>

        <DataTable.Row>
          <DataTable.Cell textStyle={{ fontFamily: boldFont }}>
            Balance
          </DataTable.Cell>
          <DataTable.Cell textStyle={{ fontFamily: boldFont }} numeric>
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
