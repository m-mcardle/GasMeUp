// React
import React, { useCallback, useState, useEffect } from 'react';
import { Alert, View, Image } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';

import Checkbox from 'expo-checkbox';
import { DataTable, Portal } from 'react-native-paper';

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
import { getIcon } from '../../helpers/iconHelper';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

function RowBuilder(
  selectedFriends: Array<any>,
  setSelectedFriend: (_ : Array<any>) => void,
) {
  function Row({
    name,
    uid,
    email,
    firstName,
    lastName,
  }: any) {
    const updateSelectedFriends = (friend: any) => {
      const friendIndex = selectedFriends.findIndex((el) => el.uid === friend.uid);
      if (friendIndex === -1) {
        setSelectedFriend([...selectedFriends, friend]);
      } else {
        selectedFriends.splice(friendIndex, 1);
        setSelectedFriend([...selectedFriends]);
      }
    };

    const isSelected = !!selectedFriends.find((friend: any) => friend.uid === uid);
    return (
      <DataTable.Row
        key={name + uid}
        onPress={() => updateSelectedFriends({
          name, uid, email, firstName, lastName,
        })}
      >
        <DataTable.Cell style={{ maxWidth: '15%', justifyContent: 'center', alignContent: 'center' }}>
          <Image
            style={{ width: 32, height: 32, borderRadius: 64 }}
            source={getIcon({ email, name })}
          />
        </DataTable.Cell>
        <DataTable.Cell>
          {name}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          <Checkbox
            onValueChange={() => updateSelectedFriends({
              name, uid, email, firstName, lastName,
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

interface Props {
  start: string,
  end: string,
  cost: number,
  gasPrice: number,
  distance: number,
  gasMileage: number,
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function SaveTripSplitwiseScreen({
  start, end, cost, gasPrice, distance, gasMileage, navigation,
}: Props) {
  const [globalState] = useGlobalState();
  const [selectedFriends, setSelectedFriends] = useState<Array<any>>([]);
  const [splitTypeVisible, setSplitTypeVisible] = useState(false);
  const [uid, setUID] = useState(0);
  const [usersData, setUsersData] = useState<any>([]);
  const { splitwiseToken } = globalState;

  // This converts from $/gal to $/L if needed
  const canadianGasPrice = Number(
    convertGasPrice(gasPrice, globalState.country, 'CA').toFixed(4),
  );

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://www.splitwise.com/api/v3.0/get_friends', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${splitwiseToken}`,
        },
      });

      const json = await response.json();
      const data = json.friends.map((friend: any) => ({
        name: `${friend.first_name} ${friend.last_name}`.trim(),
        firstName: friend.first_name,
        lastName: friend.last_name,
        email: friend.email,
        uid: friend.id,
        key: friend.id,
        amount: friend.balance[0]?.amount ?? 0,
      })).sort((a: any, b: any) => {
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
      setUsersData(data);

      const userResponse = await fetch('https://www.splitwise.com/api/v3.0/get_current_user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${splitwiseToken}`,
        },
      });
      const userJson = await userResponse.json();
      setUID(userJson.user.id);
    };

    if (splitwiseToken) {
      fetchData();
    }
  }, [splitwiseToken]);

  const saveTrip = useCallback(async (
    friends: Array<any>,
    driver: any,
    splitType: 'split' | 'full',
  ) => {
    if (!splitwiseToken) {
      return;
    }
    const isDriver = (user: any) => user.uid === driver.uid;
    const userIsDriver = driver.uid === uid;
    const friendUIDs = friends.map((friend) => friend.uid);

    const fullAmount = cost.toFixed(2);
    const splitAmount = splitType === 'full'
      ? (cost / friendUIDs.length).toFixed(2)
      : (cost / (friendUIDs.length + 1)).toFixed(2);

    const friendObject: Record<string, any> = {};
    friends.forEach((friend, i) => {
      friendObject[`users__${i + 1}__user_id`] = friend.uid;
      friendObject[`users__${i + 1}__paid_share`] = isDriver(friend) ? fullAmount : '0';
      friendObject[`users__${i + 1}__owed_share`] = isDriver(friend) && splitType === 'full' ? '0' : splitAmount;
      friendObject[`users__${i + 1}__email`] = friend.email;
      friendObject[`users__${i + 1}__first_name`] = friend.firstName;
      friendObject[`users__${i + 1}__last_name`] = friend.lastName;
    });

    const body = JSON.stringify({
      cost: fullAmount,
      description: 'GasMeUp Trip',
      details: `Start: ${start}\nEnd: ${end}\nDistance: ${distance}km\nGas Mileage: ${gasMileage}L/100km\nGas Price: $${canadianGasPrice}/L`,
      group_id: 0, // Personal Expense
      date: new Date().toISOString(),
      category_id: 31, // Transportation
      currency_code: 'CAD',
      split_equally: false,
      users__0__user_id: uid,
      users__0__paid_share: userIsDriver ? fullAmount : '0',
      users__0__owed_share: userIsDriver ? '0' : splitAmount,
      ...friendObject,
    });

    console.log(body);
    return;

    try {
      const response = await fetch('https://www.splitwise.com/api/v3.0/create_expense', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${splitwiseToken}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      const json = await response.json();
      console.log(json);

      Alert.alert('Success', 'Trip was saved!');
      navigation.goBack();
    } catch (exception) {
      console.log(exception);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      navigation.goBack();
    }
  }, [splitwiseToken, cost, start, end, distance, gasMileage, canadianGasPrice]);

  const headers = [
    { text: '', numeric: false, style: { maxWidth: '15%' } },
    { text: 'Name', numeric: false },
    { text: 'Split Trip', numeric: true },
  ];
  const useCanadianUnits = globalState.Locale === Locale.CA;
  const gasUsed = (distance * gasMileage) / 100;
  const convertedGasPrice = convertGasPrice(gasPrice, globalState.country, useCanadianUnits ? 'CA' : 'US');

  const truncatedStart = start.length > 50 ? `${start.substring(0, 50)}...` : start;
  const truncatedEnd = end.length > 50 ? `${end.substring(0, 50)}...` : end;
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
          <TripSettingsModal
            cost={cost}
            closeModal={() => setSplitTypeVisible(false)}
            saveTrip={saveTrip}
            selectedFriends={selectedFriends}
            currentUser={{
              firstName: 'Matt',
              lastName: 'McArdle',
              uid,
            }}
          />
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
        // loading={usersDataLoading}
        style={{ marginTop: 16 }}
        EmptyState={TableEmptyState}
        scrollable
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
    </Page>
  );
}
