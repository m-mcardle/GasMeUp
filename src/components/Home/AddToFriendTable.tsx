// React
import React, { useCallback, useState } from 'react';
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
import Button from '../Button';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

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
  gasMileage: number,
  waypoints: Array<LatLng>,
  closeModal: Function,
}

export default function AddToFriendTable({
  start, end, cost, gasPrice, distance, closeModal, gasMileage, waypoints,
}: Props) {
  const [globalState] = useGlobalState();
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
        amount: Number(cost.toFixed(2)),
        payeeUID: owed ? friend.uid : currentUser.uid,
        payers: [owed ? currentUser.uid : friend.uid],
        splitType: 'full',
        distance,
        gasPrice,
        startLocation: start,
        endLocation: end,
        gasMileage,
        date: new Date(),
        creator: currentUser.uid,
        users: [currentUser.uid, friend.uid],
        waypoints,
        country: globalState.country,
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

  const truncatedStart = start.length > 50 ? `${start.substring(0, 50)}...` : start;
  const truncatedEnd = end.length > 50 ? `${end.substring(0, 50)}...` : end;
  const gasPriceString = globalState.country === 'CA' ? `$${gasPrice.toFixed(2)}/L` : `$${gasPrice.toFixed(2)}/gal`;

  return (
    <>
      <Text style={globalStyles.title}>Save Trip</Text>
      <View style={styles.saveTripLocationHeaderContainer}>
        <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
          {'Start: '}
        </Text>
        <Text style={globalStyles.smallText}>
          {truncatedStart}
        </Text>
      </View>
      <View style={styles.saveTripLocationHeaderContainer}>
        <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
          {'End: '}
        </Text>
        <Text style={globalStyles.smallText}>
          {truncatedEnd}
        </Text>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
            {'Cost: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {`$${cost.toFixed(2)}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
            {'Distance: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {`${distance.toFixed(1)}km`}
          </Text>
        </View>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
            {'Gas Used: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {`${((distance * gasMileage) / 100).toFixed(1)}L`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
            {'Gas Price: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {gasPriceString}
          </Text>
        </View>
      </View>
      <Table
        title=""
        itemsPerPage={5}
        data={usersData}
        headers={headers}
        Row={RowBuilder(selectedFriend, setSelectedFriend)}
        loading={usersDataLoading}
      />
      <View style={styles.saveTripButtonSection}>
        <Button
          disabled={!selectedFriend.uid}
          style={{ ...styles.addToFriendButton, backgroundColor: colors.red }}
          onPress={() => addCostToFriend(selectedFriend, true)}
        >
          <Text style={{ ...globalStyles.smallText, color: colors.white }}>
            Owed by you
          </Text>
        </Button>
        <Button
          disabled={!selectedFriend.uid}
          style={{ ...styles.addToFriendButton, backgroundColor: colors.green }}
          onPress={() => addCostToFriend(selectedFriend, false)}
        >
          <Text style={{ ...globalStyles.smallText, color: colors.white }}>
            Paid by you
          </Text>
        </Button>
      </View>
    </>
  );
}
