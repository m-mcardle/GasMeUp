// React
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import Checkbox from 'expo-checkbox';
import { DataTable, Portal } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Table from '../Table';
import Text from '../Text';
import Button from '../Button';
import Modal from '../Modal';

import TripSettingsModal from './TripSettingsModal';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { createTransaction } from '../../helpers/firestoreHelper';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

function RowBuilder(
  selectedFriends: Array<DocumentData>,
  setSelectedFriend: (_ : Array<DocumentData>) => void,
) {
  function Row({ firstName, lastName, uid }: DocumentData) {
    const updateSelectedFriends = (friend: DocumentData) => {
      const friendIndex = selectedFriends.findIndex((el) => el.uid === friend.uid);
      if (friendIndex === -1) {
        setSelectedFriend([...selectedFriends, friend]);
      } else {
        setSelectedFriend(selectedFriends.filter((el) => el.uid !== friend.uid));
      }
    };

    const isSelected = !!selectedFriends.find((friend: DocumentData) => friend.uid === uid);
    return (
      <DataTable.Row
        key={firstName + lastName + uid}
        onPress={() => updateSelectedFriends({ firstName, lastName, uid })}
      >
        <DataTable.Cell>
          {`${firstName} ${lastName}`}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          <Checkbox
            onValueChange={() => updateSelectedFriends({ firstName, lastName, uid })}
            value={isSelected}
            color={colors.action}
          />
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
  waypoints: Array<Location>,
  closeModal: Function,
}

export default function AddToFriendTable({
  start, end, cost, gasPrice, distance, closeModal, gasMileage, waypoints,
}: Props) {
  const [globalState] = useGlobalState();
  const [selectedFriends, setSelectedFriends] = useState<Array<DocumentData>>([]);
  const [splitTypeVisible, setSplitTypeVisible] = useState(false);

  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};
  const friendsUIDs = Object.keys(userFriends);

  const usersQuery = friendsUIDs.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [usersData = [], usersDataLoading, errorUsersDB] = useCollectionData(usersQuery);

  usersData.sort((a, b) => {
    const aName = `${a.firstName} ${a.lastName}`;
    const bName = `${b.firstName} ${b.lastName}`;
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
  // Add key for each Row
  // eslint-disable-next-line no-param-reassign
  usersData.forEach((el) => { el.key = el.firstName + el.lastName + el.uid; });

  const saveTrip = useCallback(async (
    friends: Array<DocumentData>,
    driver: DocumentData,
    splitType: 'split' | 'full',
  ) => {
    if (!currentUser?.uid) {
      return;
    }
    const userIsDriver = driver.uid === currentUser.uid;
    const friendUIDs = friends.map((friend) => friend.uid);

    const payers = userIsDriver
      ? friendUIDs
      : [currentUser.uid, ...friendUIDs.filter((friend) => friend !== driver.uid)];

    const amount = splitType === 'full'
      ? Number((cost / payers.length).toFixed(2))
      : Number((cost / (payers.length + 1)).toFixed(2));
    try {
      await createTransaction({
        cost: Number(cost.toFixed(2)),
        amount,
        payeeUID: driver.uid,
        payers,
        splitType,
        distance,
        gasPrice,
        startLocation: start,
        endLocation: end,
        gasMileage,
        date: new Date(),
        creator: currentUser.uid,
        users: [currentUser.uid, ...friendUIDs],
        waypoints,
        country: globalState.country,
        type: 'trip',
      });
      Alert.alert('Success', 'Trip was saved!');
      closeModal();
    } catch (exception) {
      console.log(exception);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      closeModal();
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
      <Portal>
        <Modal
          visible={splitTypeVisible}
          onDismiss={() => setSplitTypeVisible(false)}
        >
          {userDocument && (
            <TripSettingsModal
              cost={cost}
              closeModal={() => setSplitTypeVisible(false)}
              saveTrip={saveTrip}
              selectedFriends={selectedFriends}
              userDocument={userDocument}
            />
          )}
        </Modal>
      </Portal>
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
        Row={RowBuilder(selectedFriends, setSelectedFriends)}
        loading={usersDataLoading}
      />
      <View style={styles.saveTripButtonSection}>
        <Button
          disabled={selectedFriends.length < 1}
          onPress={() => setSplitTypeVisible(true)}
        >
          <Text>
            Save
          </Text>
        </Button>
      </View>
    </>
  );
}
