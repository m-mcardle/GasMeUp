// React
import React, { useEffect, useState } from 'react';
import {
  Alert, TouchableOpacity, View,
} from 'react-native';

import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import {
  DataTable, Portal, SegmentedButtons,
} from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';
import Modal from '../../components/Modal';

import AddFriendsSection from '../../components/Friends/AddFriendsSection';
import FriendRequestsSection from '../../components/Friends/FriendRequestsSection';
import Row from '../../components/Friends/FriendRow';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';
// @ts-ignore
import GasMeUpLogo from '../../../assets/car.png';

function FooterRow(onPress: () => void) {
  return (
    <DataTable.Row
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.darkestGray,
        borderBottomWidth: 1,
        borderBottomColor: colors.darkestGray,
      }}
      onPress={onPress}
    >
      <DataTable.Cell textStyle={{ color: colors.secondary, fontFamily: boldFont }}>
        Add Friend
      </DataTable.Cell>
      <DataTable.Cell textStyle={{ color: colors.secondary }} numeric>
        <Ionicons name="person-add" size={24} color={colors.secondary} />
      </DataTable.Cell>
    </DataTable.Row>
  );
}

function TableEmptyState() {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.secondary, fontSize: 24 }}>No Friends</Text>
      <Text style={{ color: colors.secondary, fontSize: 10 }}>
        Add some friends and then they will show up here!
      </Text>
    </View>
  );
}

const logout = () => {
  signOut(auth)
    .then(() => {
      console.log('signed out!');
    })
    .catch((exception) => {
      Alert.alert('Error', exception.message);
    });
};

const usersRef = collection(db, 'Users');

interface Props {
  setFriend: (friend: FriendObject) => void,
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function FriendsScreen({ navigation, setFriend }: Props) {
  const [globalState] = useGlobalState();
  const [user,, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const userFriends = userDocument ? userDocument.friends : undefined;
  const friendsUIDs = userFriends
    ? Object.keys(userFriends).filter((uid) => !uid.includes('TEMP_'))
    : undefined;

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

      // If the current friend hasn't been accepted yet, then don't show them
      if (!userFriends[currentFriend.uid].accepted) {
        return null;
      }

      return {
        name: `${currentFriend?.firstName} ${currentFriend?.lastName}`,
        amount: userFriends[uid].balance,
        email: currentFriend?.email,
        key: uid,
        uid,
      };
    })
      .filter((el) => el)
      .sort((a, b) => a!.amount - b!.amount) as Array<object>
    : [] as Array<object>;

  const [visible, setVisible] = useState(false);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);

  // Set the user's notification token if possible
  useEffect(() => {
    if (globalState.expoToken && userDoc && userDocument && !userDocument.notificationToken) {
      updateDoc(userDoc, {
        notificationToken: globalState.expoToken,
      });
    }
  }, [globalState.expoToken, userDocument]);

  if (errorUserDB || errorFriendsDB || error) {
    console.log(errorUserDB, errorFriendsDB, error);
  }

  const headers = [
    { text: '', numeric: false, style: { maxWidth: '15%' } },
    { text: 'Friend', numeric: false },
    { text: 'Amount Owed', numeric: true },
  ];

  const MyRow = ({
    name,
    amount,
    uid,
    email,
  }: any) => Row({
    email,
    name,
    amount,
    uid,
    onPress: (friend: FriendObject) => {
      setFriend(friend);
      navigation.navigate('Friend');
    },
  });
  const Footer = () => FooterRow(() => validateCurrentUser(user) && setVisible(true));

  const friendRequestUIDs = Object.keys(userDocument?.friends ?? {})
    .filter((uid: string) => userDocument?.friends[uid]?.status === 'incoming') ?? [];

  const hasFriendRequests = friendRequestUIDs.length > 0;
  return (
    <Page>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible((state) => !state)}
        >
          <AddFriendsSection
            close={() => setVisible(false)}
          />
        </Modal>
        <Modal
          visible={friendRequestsVisible}
          onDismiss={() => setFriendRequestsVisible((state) => !state)}
        >
          <FriendRequestsSection
            friendRequestUIDs={friendRequestUIDs}
            closeModal={() => setFriendRequestsVisible(false)}
          />
        </Modal>
      </Portal>

      <View style={globalStyles.headerSection}>
        <TouchableOpacity
          style={{ flexDirection: 'row' }}
          onPress={
            () => validateCurrentUser(user) && hasFriendRequests && setFriendRequestsVisible(true)
          }
        >
          <Text style={{ color: colors.white }}>{friendRequestUIDs.length}</Text>
          <FontAwesome5 name="user-friends" size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
        >
          <Ionicons name="log-out" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Table
        title="Friends"
        data={formattedBalances}
        headers={headers}
        Row={MyRow}
        FooterRow={Footer}
        loading={friendsDataLoading || !friendsUIDs}
        style={styles.table}
        EmptyState={TableEmptyState}
        scrollable
      />
      <SegmentedButtons
        style={{ width: '70%', alignSelf: 'center', marginTop: 'auto' }}
        buttons={[
          {
            value: 'GasMeUp',
            label: 'GasMeUp',
            style: { backgroundColor: colors.action },
            icon: GasMeUpLogo,
          },
          {
            value: 'Splitwise',
            label: 'Splitwise',
            style: { backgroundColor: colors.primary },
            icon: SplitwiseLogo,
          },
        ]}
        onValueChange={() => navigation.navigate('IndexSplitwise')}
        value="GasMeUp"
      />
    </Page>
  );
}
