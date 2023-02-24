// React
import React, { useCallback, useState } from 'react';
import {
  Alert, Image, ScrollView, View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ActivityIndicator, DataTable, Portal } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Text from '../../components/Text';
import Button from '../../components/Button';
import MapModal from '../../components/MapModal';
import Modal from '../../components/Modal';
import Page from '../../components/Page';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors, boldFont } from '../../styles/styles';

// Helpers
import { locationToLatLng } from '../../helpers/mapHelper';
import { createTransaction } from '../../helpers/firestoreHelper';
import TripDetailsModal from '../../components/Friends/TripDetailsModal';
import { getIcon } from '../../helpers/iconHelper';
import { truncateString } from '../../helpers/truncationHelper';

const transactionsRef = collection(db, 'Transactions');

interface Props {
  uid: string,
  name: string,
  email: string | undefined,
  amount: number,
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function FriendInfoScreen({
  uid, name, amount, email, navigation,
}: Props) {
  const [currentUser] = useAuthState(auth);
  const [mapVisible, setMapVisible] = useState(false);
  const [viewMoreVisible, setViewMoreVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<DocumentData>({});

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser?.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  // Query for transactions involving he current user
  const transactionsQuery = userDocument?.transactions.length > 0
    ? query(transactionsRef, where('users', 'array-contains', currentUser?.uid))
    : undefined;
  const [transactionsData, transactionsLoading] = useCollectionData(transactionsQuery);

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
      navigation.goBack();
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
    return transaction.amount * (userIsPayee ? 1 : -1);
  };

  const showSettleConfirmationAlert = () => Alert.alert(
    'Settle Up',
    `Are you sure you want to settle up with ${name} for $${amount.toFixed(2)}?`,
    [
      {
        text: 'OK',
        onPress: () => settleUp(),
        style: 'default',
      },
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ],
  );

  return (
    <Page>
      <Portal>
        <Modal
          visible={viewMoreVisible}
          onDismiss={() => setViewMoreVisible(false)}
        >
          <TripDetailsModal
            transaction={selectedTransaction}
            setMapVisible={() => setMapVisible(true)}
            transactionAmount={getTransactionAmount(selectedTransaction)}
            transactionWaypoints={transactionWaypoints}
          />
        </Modal>

        <Modal
          visible={mapVisible}
          onDismiss={() => setMapVisible(false)}
        >
          {transactionWaypoints.length > 0 && (
            <MapModal
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
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Image
          style={{ width: 64, height: 64, marginHorizontal: 'auto' }}
          source={getIcon({ email, name })}
        />
      </View>
      <Text style={styles.friendInfoTitle}>
        {name}
      </Text>
      <Text style={styles.friendInfoSubtitle}>
        {email}
      </Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ maxWidth: '10%' }}> </DataTable.Title>
          <DataTable.Title style={{ minWidth: '35%' }}>Start/End</DataTable.Title>
          <DataTable.Title numeric>Date</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
        </DataTable.Header>

        {transactionsLoading && (
          <DataTable.Row style={{ minHeight: 150, alignContent: 'center' }}>
            <DataTable.Cell style={{ alignContent: 'center', justifyContent: 'center' }}>
              <ActivityIndicator animating color={colors.action} size="large" />
            </DataTable.Cell>
          </DataTable.Row>
        )}

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
              <DataTable.Cell
                style={{ minWidth: '35%' }}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setViewMoreVisible(true);
                }}
              >
                <View style={{ justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8 }}>
                    {`Start: ${truncateString(transaction.startLocation, 30)}`}
                  </Text>
                  <Text style={{ fontSize: 8, paddingTop: 4 }}>
                    {`End: ${truncateString(transaction.endLocation, 30)}`}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell
                textStyle={{ fontSize: 8 }}
                numeric
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setViewMoreVisible(true);
                }}
              >
                {transaction.date.toDate().toLocaleDateString()}
              </DataTable.Cell>
              <DataTable.Cell
                textStyle={{
                  fontSize: 10,
                  color: getTransactionAmount(transaction) > 0 ? colors.white : colors.red,
                }}
                numeric
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setViewMoreVisible(true);
                }}
              >
                $
                {getTransactionAmount(transaction) > 0
                  ? getTransactionAmount(transaction).toFixed(2)
                  : (getTransactionAmount(transaction) * -1).toFixed(2)}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </ScrollView>

        {!transactionsLoading && transactionsSinceLastSettle.length === 0 && (
        <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 24 }}>
          <Text style={{ color: colors.secondary, fontSize: 24 }}>No Trips</Text>
          <Text style={{ color: colors.secondary, fontSize: 10 }}>
            You and this friend are all settled up!
          </Text>
        </View>
        )}

        <DataTable.Row
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.darkestGray,
            borderBottomWidth: 1,
            borderBottomColor: colors.darkestGray,
          }}
        >
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
          onPress={showSettleConfirmationAlert}
        >
          <Text style={{ color: 'white' }}>Settle Up</Text>
        </Button>
      </View>
    </Page>
  );
}
