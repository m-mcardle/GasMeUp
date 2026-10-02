// React
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, StyleSheet, View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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
import Alert from '../../components/Alert';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ListRow from '../../components/ListRow';
import SectionHeader from '../../components/SectionHeader';

import TripDetailsModal from './components/TripDetailsModal';
import { balanceLabel } from './components/FriendRow';

// Styles
import { color, radius, space } from '../../styles/theme';

// Helpers
import { createTransaction } from '../../helpers/firestoreHelper';
import { logEvent } from '../../helpers/analyticsHelper';

const styles = StyleSheet.create({
  profile: {
    alignItems: 'center',
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  balance: {
    alignItems: 'center',
    gap: space.xs,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    paddingVertical: space.huge,
  },
});

const firstPart = (address: string | undefined) => (address ?? 'Unknown').split(',')[0];

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
  const formattedAmount = `$${Math.abs(amount).toFixed(2)}`;
  const firstName = name.split(' ')[0];

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

    logEvent('settled_up', {
      amount,
    });

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

  const openTransactionViewMore = (transaction: DocumentData) => {
    logEvent('viewed_transaction_details');

    setSelectedTransaction(transaction);
    setViewMoreVisible(true);
  };

  const showSettleConfirmationAlert = () => Alert(
    `Settle up with ${firstName}?`,
    `This clears your ${formattedAmount} balance and starts a fresh trip history.`,
    [
      {
        text: 'Settle up',
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

  const { label: balanceText, tone: balanceTone } = balanceLabel(amount);
  let balanceSentence = 'You’re all settled up';
  if (balanceTone === 'success') balanceSentence = `${firstName} owes you`;
  if (balanceTone === 'danger') balanceSentence = `You owe ${firstName}`;

  return (
    <Page scroll safeTop={false}>
      <Modal
        visible={viewMoreVisible}
        title="Trip details"
        onDismiss={() => setViewMoreVisible(false)}
      >
        <TripDetailsModal
          transaction={selectedTransaction}
          setMapVisible={() => {
            // Only one sheet can be presented at a time.
            setViewMoreVisible(false);
            setTimeout(() => setMapVisible(true), 350);
          }}
          transactionAmount={getTransactionAmount(selectedTransaction)}
          transactionWaypoints={transactionWaypoints}
        />
      </Modal>

      <Modal
        visible={mapVisible}
        title="Route"
        tall
        onDismiss={() => setMapVisible(false)}
      >
        {transactionWaypoints.length > 0 && (
          <MapModal
            showUserLocation={false}
            waypoints={transactionWaypoints}
            startAddress={selectedTransaction.startLocation}
            endAddress={selectedTransaction.endLocation}
          />
        )}
      </Modal>

      <View style={styles.profile}>
        <Avatar name={name} email={email} size={76} />
        <Text variant="title2" align="center" style={{ marginTop: space.md }}>{name}</Text>
        {!!email && <Text variant="footnote" tone="tertiary" align="center">{email}</Text>}
      </View>

      <Card style={styles.balance}>
        <Text variant="overline" tone="tertiary">{balanceText}</Text>
        <Text variant="display" tone={balanceTone === 'tertiary' ? 'primary' : balanceTone}>{formattedAmount}</Text>
        <Text variant="subhead" tone="secondary">{balanceSentence}</Text>
        <Button
          title="Settle up"
          icon="checkmark-done"
          fullWidth
          style={{ marginTop: space.lg }}
          disabled={transactionsSinceLastSettle.length === 0 && amount === 0}
          onPress={showSettleConfirmationAlert}
        />
      </Card>

      <SectionHeader title="Trips since last settle-up" />
      {transactionsLoading && (
        <ActivityIndicator style={styles.loading} color={color.primaryText} size="large" />
      )}
      {!transactionsLoading && transactionsSinceLastSettle.length === 0 && (
        <Card>
          <EmptyState icon="car-outline" title="No trips yet" message={`Trips you share with ${firstName} will show up here.`} style={{ paddingVertical: space.lg }} />
        </Card>
      )}
      {!transactionsLoading && transactionsSinceLastSettle.length > 0 && (
        <Card padded={false}>
          {transactionsSinceLastSettle.map((transaction, index) => {
            const transactionAmount = getTransactionAmount(transaction);
            const hasRoute = transaction?.waypoints?.length > 0;
            return (
              <ListRow
                key={transaction.payeeUID + transaction.amount + transaction.date}
                title={`${firstPart(transaction.startLocation)} → ${firstPart(transaction.endLocation)}`}
                subtitle={transaction.date.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                separator={index < transactionsSinceLastSettle.length - 1}
                leading={(
                  <View style={styles.tripIcon}>
                    <Ionicons name={hasRoute ? 'map-outline' : 'car-outline'} size={20} color={color.primaryText} />
                  </View>
                )}
                trailing={(
                  <Text variant="headline" tone={transactionAmount > 0 ? 'success' : 'danger'}>
                    {`${transactionAmount > 0 ? '+' : '−'}$${Math.abs(transactionAmount).toFixed(2)}`}
                  </Text>
                )}
                onPress={() => openTransactionViewMore(transaction)}
              />
            );
          })}
        </Card>
      )}
    </Page>
  );
}
