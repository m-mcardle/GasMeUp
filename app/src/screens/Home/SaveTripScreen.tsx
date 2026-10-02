// React
import React, { useCallback, useState } from 'react';
import {
  Image, StyleSheet, Switch, View,
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
import Table from '../../components/Table';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Page from '../../components/Page';
import Alert from '../../components/Alert';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import ListRow from '../../components/ListRow';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';

import TripSettingsModal from './components/TripSettingsModal';

// Global State
import { useGlobalState, Locale } from '../../hooks/hooks';
import { convertGasPrice, convertKMtoMiles, convertLtoGallons } from '../../helpers/unitsHelper';

// Helpers
import { createTransaction } from '../../helpers/firestoreHelper';
import { logEvent } from '../../helpers/analyticsHelper';
import { isFeatureEnabled } from '../../helpers/featureHelper';

// Styles
import { color, radius, space } from '../../styles/theme';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';

const styles = StyleSheet.create({
  route: {
    gap: space.sm,
  },
  endpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  splitwise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});

function RowBuilder(
  selectedFriends: Array<User>,
  setSelectedFriend: (_ : Array<User>) => void,
) {
  function Row({
    firstName,
    lastName,
    uid,
    email,
    isLast,
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
      <ListRow
        title={name}
        separator={!isLast}
        leading={<Avatar name={name} email={email} />}
        accessibilityLabel={`${name}${isSelected ? ', selected' : ''}`}
        trailing={(
          <View
            style={[
              styles.check,
              isSelected
                ? { backgroundColor: color.primary, borderColor: color.primary }
                : { borderColor: color.borderStrong },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color={color.textOnPrimary} />}
          </View>
        )}
        onPress={() => updateSelectedFriends({
          firstName, lastName, uid, email,
        })}
      />
    );
  }

  return Row;
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
  // Splitwise's API needs a paid Pro subscription, so the integration is off unless the flag is on.
  const splitwiseEnabled = isFeatureEnabled('splitwise_screen');

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
      Alert('Error', 'You must be logged in to save a trip');
      navigation.navigate('Friends/Login');
      return;
    }

    logEvent('saved_trip', {
      friends: friends.length,
      is_driver: driver.uid === currentUser.uid,
      split_type: splitType,
      amount: cost,
    });

    const isDriver = (user: any) => user.uid === driver.uid;
    const userIsDriver = driver.uid === currentUser.uid;
    const friendUIDs = friends.map((friend) => String(friend.uid));

    const payers = userIsDriver
      ? friendUIDs
      : [currentUser.uid, ...friendUIDs.filter((friend) => friend !== driver.uid)];

    // Trips are only saved to split the cost, so there must be at least one rider
    // (Firestore rules reject a trip with no payers).
    if (payers.length === 0) {
      Alert('Error', 'Select at least one friend who was on this trip');
      return;
    }

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

      if (splitwiseEnabled && useSplitwise && userDocument?.splitwiseUID && splitwiseToken) {
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

      Alert('Trip saved', 'Your friends’ balances have been updated.');
      navigation.goBack();
    } catch (exception) {
      console.log(exception);
      Alert('Error', 'Something went wrong. Please try again later.');
      navigation.goBack();
    }
  }, [currentUser, cost, distance, gasPrice, useSplitwise, splitwiseEnabled]);

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  const useCanadianUnits = globalState.Locale === Locale.CA;
  const gasUsed = (distance * gasMileage) / 100;
  const convertedGasPrice = convertGasPrice(gasPrice, globalState.country, useCanadianUnits ? 'CA' : 'US');

  const gasPriceString = useCanadianUnits ? `$${convertedGasPrice.toFixed(2)}/L` : `$${convertedGasPrice.toFixed(2)}/gal`;
  const gasUsageString = useCanadianUnits ? `${(gasUsed).toFixed(1)} L` : `${convertLtoGallons(gasUsed).toFixed(1)} gal`;
  const distanceString = useCanadianUnits ? `${distance.toFixed(1)} km` : `${convertKMtoMiles(distance).toFixed(1)} mi`;

  const friendCount = selectedFriends.length;

  const friendsEmptyState = (
    <EmptyState
      icon="people-outline"
      title="No friends yet"
      message="Add friends from the Friends tab to split trips with them."
      action={<Button title="Go to Friends" size="sm" variant="secondary" onPress={() => navigation.navigate('Friends/Login')} />}
    />
  );

  return (
    <Page
      scroll
      safeTop={false}
      footer={(
        <Button
          title={friendCount ? `Continue with ${friendCount} friend${friendCount === 1 ? '' : 's'}` : 'Select who was on this trip'}
          icon={friendCount ? 'arrow-forward' : undefined}
          fullWidth
          disabled={friendCount < 1}
          onPress={() => setSplitTypeVisible(true)}
        />
      )}
    >
      <Modal
        visible={splitTypeVisible}
        title="Who drove?"
        subtitle="Everyone else pays the driver back."
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

      <Card style={{ marginTop: space.sm }}>
        <Text variant="overline" tone="tertiary">Trip total</Text>
        <Text variant="title1" style={{ marginBottom: space.md }}>{`$${cost.toFixed(2)}`}</Text>
        <View style={styles.route}>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: color.primaryText }]} />
            <Text variant="footnote" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>{start}</Text>
          </View>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: color.success }]} />
            <Text variant="footnote" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>{end}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="caption" tone="tertiary">Distance</Text>
            <Text variant="callout">{distanceString}</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="caption" tone="tertiary">Fuel</Text>
            <Text variant="callout">{gasUsageString}</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="caption" tone="tertiary">Gas price</Text>
            <Text variant="callout">{gasPriceString}</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="Who was in the car?" />
      <Table
        data={usersData}
        Row={RowBuilder(selectedFriends, setSelectedFriends)}
        loading={usersDataLoading}
        emptyState={friendsEmptyState}
      />

      {splitwiseEnabled && splitwiseToken && userDocument?.splitwiseUID && (
      <Card style={styles.splitwise}>
        <Image source={SplitwiseLogo} style={{ width: 24, height: 24 }} />
        <Text variant="callout" style={{ flex: 1 }}>Also add to Splitwise</Text>
        <Switch
          value={useSplitwise}
          onValueChange={setUseSplitwise}
          trackColor={{ false: color.surfacePressed, true: color.primary }}
          ios_backgroundColor={color.surfacePressed}
        />
      </Card>
      )}
    </Page>
  );
}
