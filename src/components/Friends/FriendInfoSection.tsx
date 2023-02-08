// React
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { DataTable, Portal } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Text from '../Text';
import Button from '../Button';
import MapContainer from '../MapContainer';
import Modal from '../Modal';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors, boldFont } from '../../styles/styles';

// Helpers
import { locationToLatLng } from '../../helpers/mapHelper';
import { createTransaction } from '../../helpers/firestoreHelper';

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
  const [mapVisible, setMapVisible] = useState(false);
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
      console.log('User not logged in');
      return;
    }
    try {
      await createTransaction({
        amount: amount * -1,
        cost: amount * -1,
        payeeUID: currentUser.uid,
        payers: [uid],
        date: new Date(),
        users: [currentUser.uid, uid],
        type: 'settle',
        splitType: 'full',
        distance: 0,
        gasPrice: 0,
        creator: currentUser.uid,
      });
      close();
    } catch (exception) {
      console.log(exception);
    }
  }, [uid, name, amount, currentUser?.uid]);

  // Sort transactions by date, and then only show the transactions since the last `settle`
  const sortedTransactions = filteredTransactions
    ?.sort((a, b) => b.date.toDate() - a.date.toDate())
    ?? [];
  const lastSettleIndex = sortedTransactions.findIndex((transaction: DocumentData) => transaction.type === 'settle');
  const transactionsSinceLastSettle = lastSettleIndex !== -1
    ? sortedTransactions.slice(0, lastSettleIndex)
    : sortedTransactions;

  const transactionWaypoints = selectedTransaction.waypoints ?? [];

  // Helper method to calculate the amount associated with this friend on this transaction
  const getTransactionAmount = (transaction: DocumentData) => {
    const userIsPayee = transaction.payeeUID === currentUser?.uid;
    return `$${(transaction.amount * (userIsPayee ? 1 : -1)).toFixed(2)}`;
  };

  return (
    <View style={{ height: '100%' }}>
      <Portal>
        <Modal
          visible={mapVisible}
          onDismiss={() => setMapVisible(false)}
        >
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
        </Modal>
      </Portal>
      <Text style={styles.friendInfoTitle}>{name}</Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ maxWidth: '10%' }}> </DataTable.Title>
          <DataTable.Title style={{ minWidth: '35%' }}>Start/End</DataTable.Title>
          <DataTable.Title numeric>Date</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
        </DataTable.Header>

        <ScrollView style={{ maxHeight: 300 }}>
          {transactionsSinceLastSettle?.map((transaction) => (
            <DataTable.Row key={transaction.payeeUID + transaction.amount + transaction.date}>
              <DataTable.Cell
                style={{ maxWidth: '10%' }}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setMapVisible(true);
                }}
                disabled={!(transaction?.waypoints?.length > 0)}
              >
                {transaction?.waypoints?.length > 0 && (
                <View style={{ justifyContent: 'center', minWidth: '100%', alignItems: 'center' }}>
                  <Ionicons name="map" size={18} color={colors.action} />
                </View>
                )}
              </DataTable.Cell>
              <DataTable.Cell style={{ minWidth: '35%' }}>
                <View style={{ justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8 }}>
                    {`Start: ${(transaction.startLocation.length > 30 ? `${transaction.startLocation.substring(0, 30)}...` : transaction.startLocation)}`}
                  </Text>
                  <Text style={{ fontSize: 8, paddingTop: 4 }}>
                    {`End: ${(transaction.endLocation.length > 30 ? `${transaction.endLocation.substring(0, 30)}...` : transaction.endLocation)}`}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ fontSize: 8 }} numeric>
                {transaction.date.toDate().toLocaleDateString()}
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ fontSize: 10 }} numeric>
                {getTransactionAmount(transaction)}
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
          disabled={transactionsSinceLastSettle.length === 0 && amount === 0}
          onPress={settleUp}
        >
          <Text style={{ color: 'white' }}>Settle Up</Text>
        </Button>
      </View>
    </View>
  );
}
