// React
import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

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
import Button from '../Button';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

function RowBuilder(selectedFriend: DocumentData, setSelectedFriend: Function) {
  function Row({ firstName, lastName, uid }: DocumentData) {
    const isSelected = selectedFriend.uid === uid;
    return (
      <DataTable.Row
        key={firstName + lastName + uid}
        onPress={() => { setSelectedFriend(isSelected ? {} : { firstName, lastName, uid }); }}
        style={isSelected ? { backgroundColor: '#e0e0e0' } : undefined}
      >
        <DataTable.Cell
          textStyle={isSelected ? { color: 'black' } : undefined}
        >
          {`${firstName} ${lastName}`}
        </DataTable.Cell>
        <DataTable.Cell
          textStyle={isSelected ? { color: 'black' } : undefined}
          numeric
        >
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
  gasMileage: number,
  closeModal: Function,
}

export default function AddToFriendTable({
  start, end, cost, gasPrice, distance, riders, closeModal, gasMileage,
}: Props) {
  const [selectedFriend, setSelectedFriend] = useState<DocumentData>({});

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

  const addCostToFriend = useCallback(async (friend: DocumentData, owed: boolean = false) => {
    if (!currentUser?.uid) {
      return;
    }

    try {
      await addDoc(collection(db, 'Transactions'), {
        cost: Number(cost.toFixed(2)),
        amount: (Number(cost.toFixed(2))) / riders,
        payeeUID: owed ? currentUser.uid : friend.uid,
        payerUID: owed ? friend.uid : currentUser.uid,
        distance,
        gasPrice,
        riders,
        startLocation: start,
        endLocation: end,
        gasMileage,
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
      <TouchableOpacity onPress={() => closeModal()}>
        <Text>
          X
        </Text>
      </TouchableOpacity>
      <Text style={globalStyles.title}>Save Trip</Text>
      <View style={styles.saveTripHeaderContainer}>
        <Text style={globalStyles.smallText}>
          {`Start: ${start}`}
        </Text>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <Text style={globalStyles.smallText}>
          {`End: ${end}`}
        </Text>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <Text style={globalStyles.smallText}>
          {`Cost: $${cost.toFixed(2)}`}
        </Text>
      </View>
      <Table
        title=""
        itemsPerPage={5}
        data={usersData}
        headers={headers}
        Row={RowBuilder(selectedFriend, setSelectedFriend)}
        loading={usersDataLoading}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button
          disabled={!selectedFriend.uid}
          style={{ borderColor: colors.red, borderWidth: 4 }}
          onPress={() => addCostToFriend(selectedFriend, true)}
        >
          <Text style={{ ...globalStyles.smallText, color: colors.primary }}>
            Owed by you
          </Text>
        </Button>
        <Button
          disabled={!selectedFriend.uid}
          style={{ borderColor: colors.green, borderWidth: 4 }}
          onPress={() => addCostToFriend(selectedFriend, false)}
        >
          <Text style={{ ...globalStyles.smallText, color: colors.primary }}>
            Paid by you
          </Text>
        </Button>
      </View>
    </>
  );
}
