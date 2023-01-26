// React
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import {
  DataTable, Portal, Modal,
} from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../firebase';

// Screens
import LoginScreen from './LoginScreen';

// Components
import Page from '../components/Page';
import Table from '../components/Table';
import Text from '../components/Text';

import AddFriendsTable from '../components/Friends/AddFriendsTable';
import FriendInfoSection from '../components/Friends/FriendInfoSection';
import FriendRequestsSection from '../components/Friends/FriendRequestsSection';

// Styles
import styles from '../styles/FriendsScreen.styles';
import { boldFont, colors, globalStyles } from '../styles/styles';

function RowBuilder(onPress: (friend: any) => void) {
  function Row({ name, amount, uid }: DocumentData) {
    return (
      <DataTable.Row
        key={name}
        onPress={() => onPress({
          selectedFriendUID: uid,
          selectedFriendName: name,
          selectedFriendAmount: amount,
        })}
      >
        <DataTable.Cell textStyle={{ color: colors.secondary }}>
          {name}
        </DataTable.Cell>
        <DataTable.Cell textStyle={amount < 0 ? { color: 'red' } : { color: colors.secondary }} numeric>
          $
          {amount.toFixed(2)}
        </DataTable.Cell>
      </DataTable.Row>
    );
  }

  return Row;
}

function FooterRow(onPress: () => void) {
  return (
    <DataTable.Row onPress={onPress}>
      <DataTable.Cell textStyle={{ color: colors.secondary, fontFamily: boldFont }}>
        Add Friend
      </DataTable.Cell>
      <DataTable.Cell textStyle={{ color: colors.secondary }} numeric>
        <Ionicons name="person-add" size={24} color={colors.secondary} />
      </DataTable.Cell>
    </DataTable.Row>
  );
}

const usersRef = collection(db, 'Users');

export default function FriendsScreen() {
  const [user, loading, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const balances = userDocument ? userDocument.friends : undefined;
  const friendsUIDs = balances ? Object.keys(balances) : undefined;

  const friendsQuery = friendsUIDs?.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [friendsData, friendsDataLoading, errorFriendsDB] = useCollectionData(friendsQuery);

  const formattedBalances = (friendsData && !friendsDataLoading && friendsUIDs)
    ? friendsUIDs.map((uid: string) => {
      const currentFriend = friendsData.find((friend) => friend.uid === uid);

      // If the current friend cannot be found then set as an empty element
      // This occurs when a new friend is added for some reason...
      // We filter these elements out after the map() with filter()
      if (!currentFriend?.firstName) {
        return null;
      }
      return {
        name: `${currentFriend?.firstName} ${currentFriend?.lastName}`,
        amount: balances[uid],
        key: uid,
        uid,
      };
    }).filter((el) => el) as Array<object> : [] as Array<object>;

  const [visible, setVisible] = useState(false);
  const [friendInfoVisible, setFriendInfoVisible] = useState(false);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);

  const [{ selectedFriendUID, selectedFriendName, selectedFriendAmount }, setSelectedFriend] = useState({ selectedFriendUID: '', selectedFriendName: '', selectedFriendAmount: 0 });

  if (errorUserDB || errorFriendsDB || error) {
    console.log(errorUserDB, errorFriendsDB, error);
  }

  if (!user || loading || error) {
    return (
      <LoginScreen />
    );
  }

  const headers = [
    { text: 'Friend', numeric: false },
    { text: 'Amount Owed', numeric: true },
  ];

  // Create custom components for the table
  const Row = RowBuilder((friend: any) => {
    setSelectedFriend(friend);
    setFriendInfoVisible(true);
  });
  const Footer = () => FooterRow(() => setVisible(true));

  const hasFriendRequests = userDocument?.incomingFriendRequests.length > 0;

  return (
    <Page>
      <View style={styles.main}>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible((state) => !state)}
            contentContainerStyle={globalStyles.modal}
          >
            <AddFriendsTable
              close={() => setVisible(false)}
            />
          </Modal>

          <Modal
            visible={friendInfoVisible}
            onDismiss={() => setFriendInfoVisible((state) => !state)}
            contentContainerStyle={globalStyles.modal}
          >
            <FriendInfoSection
              uid={selectedFriendUID}
              name={selectedFriendName}
              amount={selectedFriendAmount}
              close={() => setFriendInfoVisible(false)}
            />
          </Modal>

          <Modal
            visible={friendRequestsVisible}
            onDismiss={() => setFriendRequestsVisible((state) => !state)}
            contentContainerStyle={globalStyles.modal}
          >
            <FriendRequestsSection
              friendRequestUIDs={userDocument?.incomingFriendRequests}
              closeModal={() => setFriendRequestsVisible(false)}
            />
          </Modal>
        </Portal>

        <TouchableOpacity
          style={{ paddingHorizontal: 12, justifyContent: 'flex-end', flexDirection: 'row' }}
          onPress={() => hasFriendRequests && setFriendRequestsVisible(true)}
        >
          <Text style={{ color: colors.white }}>{userDocument?.incomingFriendRequests.length}</Text>
          <FontAwesome5 name="user-friends" size={24} color="white" />
        </TouchableOpacity>

        <Table
          title="Friends"
          itemsPerPage={10}
          data={formattedBalances}
          headers={headers}
          Row={Row}
          FooterRow={Footer}
          loading={friendsDataLoading}
          style={styles.table}
        />
      </View>
    </Page>
  );
}
