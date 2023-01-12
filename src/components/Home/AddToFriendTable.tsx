// React
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, addDoc, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Table from '../Table';
import Text from '../Text';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { globalStyles } from '../../styles/styles';

function RowBuilder(addCostToFriend: Function) {
  function Row({ firstName, lastName, uid }: DocumentData) {
    return (
      <DataTable.Row
        key={firstName + lastName + uid}
        onPress={() => { addCostToFriend({ firstName, lastName, uid }); }}
      >
        <DataTable.Cell>{`${firstName} ${lastName}`}</DataTable.Cell>
        <DataTable.Cell numeric>
          +
        </DataTable.Cell>
      </DataTable.Row>
    );
  }

  return Row;
}

const usersRef = collection(db, 'Users');

interface Props {
  start: string,
  end: string,
  cost: number,
  gasPrice: number,
  distance: number,
  riders: number,
  closeModal: Function,
}

export default function AddToFriendTable({
  start, end, cost, gasPrice, distance, riders, closeModal,
}: Props) {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};
  const friendsUIDs = Object.keys(userFriends);

  const usersQuery = friendsUIDs.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [usersData = [], usersDataLoading, errorUsersDB] = useCollectionData(usersQuery);

  // Add key for each Row
  // eslint-disable-next-line no-param-reassign
  usersData.forEach((el) => { el.key = el.firstName + el.lastName + el.uid; });

  const addCostToFriend = useCallback(async (friend: DocumentData) => {
    if (!currentUser?.uid) {
      return;
    }
    try {
      await addDoc(collection(db, 'Transactions'), {
        cost: Number(cost.toFixed(2)),
        amount: Number(cost.toFixed(2)) / riders,
        payeeUID: currentUser.uid,
        payerUID: friend.uid,
        distance,
        gasPrice,
        riders,
        startLocation: start,
        endLocation: end,
        date: new Date(),
        creator: currentUser.uid,
        users: [currentUser.uid, friend.uid],
      });
      closeModal();
    } catch (exception) {
      console.log(exception);
    }
  }, [currentUser, cost, distance, gasPrice]);

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  const headers = [
    { text: 'Name', numeric: false },
    { text: 'Add', numeric: true },
  ];

  return (
    <>
      <Text style={globalStyles.title}>Save Trip</Text>
      <View style={styles.saveTripHeaderContainer}>
        <Text style={globalStyles.smallText}>
          {`Start: ${start}`}
        </Text>
        <Text style={globalStyles.smallText}>
          {`End: ${end}`}
        </Text>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <Text style={globalStyles.smallText}>
          {`Cost: $${cost}`}
        </Text>
      </View>
      <Table
        title=""
        itemsPerPage={10}
        data={usersData}
        headers={headers}
        Row={RowBuilder(addCostToFriend)}
        loading={usersDataLoading}
      />
    </>
  );
}
