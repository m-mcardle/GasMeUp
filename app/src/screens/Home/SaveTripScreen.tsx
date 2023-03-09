// React
import React, { useCallback, useState } from 'react';
import { Alert, View, Image } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';

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
import Table from '../../components/Table';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Page from '../../components/Page';

import TripSettingsModal from '../../components/Home/TripSettingsModal';

// Global State
import { useGlobalState, Locale } from '../../hooks/hooks';
import { convertGasPrice, convertKMtoMiles, convertLtoGallons } from '../../helpers/unitsHelper';

// Helpers
import { createTransaction } from '../../helpers/firestoreHelper';
import { getIcon } from '../../helpers/iconHelper';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';

function RowBuilder(
  selectedFriends: Array<User>,
  setSelectedFriend: (_ : Array<User>) => void,
) {
  function Row({
    firstName,
    lastName,
    uid,
    email,
  }: DocumentData) {
    const updateSelectedFriends = (friend: User) => {
      const friendIndex = selectedFriends.findIndex((el) => el.uid === friend.uid);
      if (friendIndex === -1) {
        setSelectedFriend([...selectedFriends, friend]);
      } else {
        selectedFriends.splice(friendIndex, 1);
        setSelectedFriend([...selectedFriends]);
      }
    };
    const name = `${firstName} ${lastName}`;

    const isSelected = !!selectedFriends.find((friend: DocumentData) => friend.uid === uid);
    return (
      <DataTable.Row
        key={firstName + lastName + uid}
        onPress={() => updateSelectedFriends({
          firstName, lastName, uid, email,
        })}
      >
        <DataTable.Cell style={{ maxWidth: '15%', justifyContent: 'center', alignContent: 'center' }}>
          <View>
            <Image
              style={{ width: 32, height: 32, borderRadius: 64 }}
              source={getIcon({ email, name })}
            />
          </View>
        </DataTable.Cell>
        <DataTable.Cell>
          {name}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          <Checkbox
            onValueChange={() => updateSelectedFriends({
              firstName, lastName, uid, email,
            })}
            value={isSelected}
            color={colors.action}
          />
        </DataTable.Cell>
      </DataTable.Row>
    );
  }

  return Row;
}

function TableEmptyState() {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.secondary, fontSize: 24 }}>No Friends</Text>
      <Text style={{ color: colors.secondary, fontSize: 10 }}>
        Add some friends to start saving your trips!
      </Text>
    </View>
  );
}

const usersRef = collection(db, 'Users');

interface User {
  uid: string | number,
  firstName: string,
  lastName: string,
  email: string,
}

interface Props {
  start: string,
  end: string,
  cost: number,
  gasPrice: number,
  distance: number,
  gasMileage: number,
  waypoints: Array<Location>,
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function SaveTripScreen({
  start, end, cost, gasPrice, distance, gasMileage, waypoints, navigation,
}: Props) {
  const [globalState] = useGlobalState();
  const [selectedFriends, setSelectedFriends] = useState<Array<User>>([]);
  const [splitTypeVisible, setSplitTypeVisible] = useState(false);
  const [useSplitwise, setUseSplitwise] = useState(false);

  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const secureUserDoc = currentUser?.uid ? doc(db, 'SecureUsers', currentUser.uid) : undefined;
  const [secureUserDocument] = useDocumentData(secureUserDoc);

  const splitwiseToken = secureUserDocument?.splitwiseToken ?? '';

  const userFriends = userDocument?.friends ?? {};
  const friendsUIDs = userFriends
    ? Object.keys(userFriends).filter((uid) => !uid.includes('TEMP_') && userFriends[uid].accepted)
    : [];

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

  // This converts from $/gal to $/L if needed
  const canadianGasPrice = Number(
    convertGasPrice(gasPrice, globalState.country, 'CA').toFixed(4),
  );

  const saveTrip = useCallback(async (
    friends: Array<User>,
    driver: User,
    splitType: 'split' | 'full',
  ) => {
    if (!currentUser?.uid) {
      return;
    }
    const isDriver = (user: any) => user.uid === driver.uid;
    const userIsDriver = driver.uid === currentUser.uid;
    const friendUIDs = friends.map((friend) => String(friend.uid));

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
        payeeUID: String(driver.uid),
        payers,
        splitType,
        distance,
        gasPrice: canadianGasPrice,
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

      if (useSplitwise && userDocument?.splitwiseUID && splitwiseToken) {
        const splitAmount = splitType === 'full'
          ? (cost / friendUIDs.length).toFixed(2)
          : (cost / (friendUIDs.length + 1)).toFixed(2);
        const fullAmount = splitType === 'full'
          ? (Number(splitAmount) * (friendUIDs.length)).toFixed(2)
          : (Number(splitAmount) * (friendUIDs.length + 1)).toFixed(2);

        let totalOwed = 0;
        const friendObject: Record<string, any> = {};
        friendObject.users__0__user_id = userDocument.splitwiseUID;
        friendObject.users__0__paid_share = userIsDriver ? fullAmount : '0';
        friendObject.users__0__owed_share = userIsDriver && splitType === 'full' ? '0' : splitAmount;
        totalOwed += Number(friendObject.users__0__owed_share);

        friends.forEach((friend, i) => {
          friendObject[`users__${i + 1}__paid_share`] = isDriver(friend) ? fullAmount : '0';
          friendObject[`users__${i + 1}__owed_share`] = isDriver(friend) && splitType === 'full' ? '0' : splitAmount;
          friendObject[`users__${i + 1}__email`] = friend.email ?? 'Unknown@email.com';
          friendObject[`users__${i + 1}__first_name`] = friend.firstName;
          friendObject[`users__${i + 1}__last_name`] = friend.lastName;
          totalOwed += Number(friendObject[`users__${i + 1}__owed_share`]);
        });

        if (totalOwed !== Number(fullAmount)) {
          console.log("ERROR: Total Owed doesn't match Full Amount");
          console.log('Total Owed:', totalOwed);
          console.log('Full Amount:', fullAmount);
          console.log('Difference:', totalOwed - Number(fullAmount));
        }

        const body = JSON.stringify({
          cost: fullAmount,
          description: 'GasMeUp Trip',
          details: `Start: ${start}\nEnd: ${end}\nDistance: ${distance}km\nGas Mileage: ${gasMileage}L/100km\nGas Price: $${canadianGasPrice}/L`,
          group_id: 0, // Personal Expense
          date: new Date().toISOString(),
          category_id: 31, // Transportation
          currency_code: 'CAD',
          split_equally: false,
          ...friendObject,
        });

        const response = await fetch('https://www.splitwise.com/api/v3.0/create_expense', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${splitwiseToken}`,
            'Content-Type': 'application/json',
          },
          body,
        });
        const json = await response.json();
        console.log('Splitwise Response:', json);
      }

      Alert.alert('Success', 'Trip was saved!');
      navigation.goBack();
    } catch (exception) {
      console.log(exception);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      navigation.goBack();
    }
  }, [currentUser, cost, distance, gasPrice, useSplitwise]);

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  const headers = [
    { text: '', numeric: false, style: { maxWidth: '15%' } },
    { text: 'Name', numeric: false },
    { text: 'Split Trip', numeric: true },
  ];
  const useCanadianUnits = globalState.Locale === Locale.CA;
  const gasUsed = (distance * gasMileage) / 100;
  const convertedGasPrice = convertGasPrice(gasPrice, globalState.country, useCanadianUnits ? 'CA' : 'US');

  const gasPriceString = useCanadianUnits ? `$${convertedGasPrice.toFixed(2)}/L` : `$${convertedGasPrice.toFixed(2)}/gal`;
  const gasUsageString = useCanadianUnits ? `${(gasUsed).toFixed(1)}L` : `${convertLtoGallons(gasUsed).toFixed(1)}gal`;
  const distanceString = useCanadianUnits ? `${distance.toFixed(1)}km` : `${convertKMtoMiles(distance).toFixed(1)}mi`;
  return (
    <Page>
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
              currentUser={userDocument as User}
            />
          )}
        </Modal>
      </Portal>
      <Text
        style={{ ...globalStyles.h2, marginBottom: 12 }}
      >
        Select your friends who were on this trip
      </Text>
      <View style={styles.saveTripLocationHeaderContainer}>
        <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
          {'Start: '}
        </Text>
        <Text style={globalStyles.smallText} numberOfLines={1}>
          {start}
        </Text>
      </View>
      <View style={styles.saveTripLocationHeaderContainer}>
        <Text style={{ ...globalStyles.smallText, fontFamily: boldFont }}>
          {'End: '}
        </Text>
        <Text style={globalStyles.smallText} numberOfLines={1}>
          {end}
        </Text>
      </View>
      <View style={[styles.saveTripHeaderContainer, { marginTop: 8 }]}>
        <View style={{ flexDirection: 'row' }}>
          <FontAwesome5 name="gas-pump" size={12} color={colors.secondary} />
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont, paddingLeft: 4 }}>
            {'Gas Used: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {gasUsageString}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <FontAwesome5 name="gas-pump" size={12} color={colors.secondary} />
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont, paddingLeft: 4 }}>
            {'Gas Price: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {gasPriceString}
          </Text>
        </View>
      </View>
      <View style={styles.saveTripHeaderContainer}>
        <View style={{ flexDirection: 'row' }}>
          <FontAwesome5 name="money-bill-alt" size={12} color={colors.secondary} />
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont, paddingLeft: 4 }}>
            {'Cost: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {`$${cost.toFixed(2)}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <FontAwesome5 name="route" size={12} color={colors.secondary} />
          <Text style={{ ...globalStyles.smallText, fontFamily: boldFont, paddingLeft: 4 }}>
            {'Distance: '}
          </Text>
          <Text style={globalStyles.smallText}>
            {distanceString}
          </Text>
        </View>
      </View>
      <Table
        itemsPerPage={5}
        data={usersData}
        headers={headers}
        Row={RowBuilder(selectedFriends, setSelectedFriends)}
        loading={usersDataLoading}
        style={{ marginTop: 4, maxHeight: '60%' }}
        EmptyState={TableEmptyState}
        scrollable
      />
      {splitwiseToken && userDocument?.splitwiseUID && (
      <View style={styles.checkBoxSection}>
        <Image source={SplitwiseLogo} style={{ width: 16, height: 16 }} />
        <Text style={{ color: colors.secondary, fontSize: 14 }}>Save on Splitwise:</Text>
        <Checkbox
          color={colors.action}
          value={useSplitwise}
          onValueChange={setUseSplitwise}
          style={styles.modalCheckBox}
        />
      </View>
      )}
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
    </Page>
  );
}
