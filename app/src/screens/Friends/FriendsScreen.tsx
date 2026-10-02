// React
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  collection, doc, query, where, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';
import { logEvent } from '../../helpers/analyticsHelper';
import { isFeatureEnabled } from '../../helpers/featureHelper';
import { getDisplayName } from '../../helpers/userHelper';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import ScreenHeader from '../../components/ScreenHeader';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';
import ListRow from '../../components/ListRow';
import SegmentedControl from '../../components/SegmentedControl';

import AddFriendsSection from './components/AddFriendsSection';
import FriendRequestsSection from './components/FriendRequestsSection';
import Row from './components/FriendRow';

// Styles
import { color, radius, space } from '../../styles/theme';

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: space.md,
  },
  summaryTile: {
    flex: 1,
    gap: space.xs,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    marginTop: space.xl,
  },
});

const usersRef = collection(db, 'Users');

interface Props {
  setFriend: (friend: FriendObject) => void,
  navigation: {
    navigate: (str: string, params?: object) => {},
    replace: (str: string) => {},
    goBack: () => {}
  },
}

export default function FriendsScreen({ navigation, setFriend }: Props) {
  const [globalState] = useGlobalState();
  const [user,, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const userFriends = userDocument ? userDocument.friends : undefined;
  // Only read the user docs of ACCEPTED friends (mirrors SaveTripScreen). Pending
  // (incoming/outgoing) requests are not friends yet; FriendRequestsSection loads
  // incoming requesters itself and falls back to the email stored in this map.
  const friendsUIDs = userFriends
    ? Object.keys(userFriends).filter((uid) => !uid.includes('TEMP_') && userFriends[uid]?.accepted)
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
      if (!userFriends[currentFriend.uid]?.accepted) {
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

  const [addFriendVisible, setAddFriendVisible] = useState(false);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);

  const openAddFriend = () => {
    logEvent('view_add_friend');
    setAddFriendVisible(true);
  };

  const openFriendRequests = () => {
    logEvent('view_friend_requests');
    setFriendRequestsVisible(true);
  };

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

  const MyRow = ({
    name,
    amount,
    uid,
    email,
    isLast,
  }: any) => Row({
    email,
    name,
    amount,
    uid,
    isLast,
    onPress: (friend: FriendObject) => {
      logEvent('view_friend');

      setFriend(friend);
      navigation.navigate('Friend');
    },
  });

  const addFriend = () => validateCurrentUser(user) && openAddFriend();

  const friendsEmptyState = (
    <EmptyState
      icon="people-outline"
      title="No friends yet"
      message="Add friends by email to split the cost of trips you take together."
      action={<Button title="Add a friend" icon="person-add" size="sm" onPress={addFriend} />}
    />
  );

  const friendRequestUIDs = Object.keys(userDocument?.friends ?? {})
    .filter((uid: string) => userDocument?.friends[uid]?.status === 'incoming') ?? [];

  const hasFriendRequests = friendRequestUIDs.length > 0;

  const balances = formattedBalances as Array<{ amount: number }>;
  const owedToYou = balances.reduce((sum, { amount }) => (amount > 0 ? sum + amount : sum), 0);
  const youOwe = balances.reduce((sum, { amount }) => (amount < 0 ? sum - amount : sum), 0);
  const loadingFriends = friendsDataLoading || !friendsUIDs;

  return (
    <Page scroll keyboardAvoiding={false}>
      <Modal
        visible={addFriendVisible}
        title="Add a friend"
        subtitle="We’ll send them a friend request if they have a GasMeUp account."
        onDismiss={() => setAddFriendVisible(false)}
      >
        <AddFriendsSection
          close={() => setAddFriendVisible(false)}
        />
      </Modal>
      <Modal
        visible={friendRequestsVisible}
        title="Friend requests"
        subtitle="Accept to start splitting trips together."
        onDismiss={() => setFriendRequestsVisible(false)}
      >
        <FriendRequestsSection
          friendRequestUIDs={friendRequestUIDs}
          friendEmails={Object.fromEntries(friendRequestUIDs.map(
            (uid: string) => [uid, userDocument?.friends[uid]?.email],
          ))}
          closeModal={() => setFriendRequestsVisible(false)}
        />
      </Modal>

      <ScreenHeader
        title="Friends"
        subtitle={getDisplayName(user, userDocument) ? `Signed in as ${getDisplayName(user, userDocument)}` : undefined}
        actions={(
          <>
            <IconButton
              icon="person-add-outline"
              accessibilityLabel="Add a friend"
              onPress={addFriend}
            />
            <IconButton
              icon="settings-outline"
              accessibilityLabel="Settings"
              onPress={() => navigation.navigate('Home', { screen: 'Settings', initial: false })}
            />
          </>
        )}
      />

      <View style={styles.summary}>
        <Card style={styles.summaryTile}>
          <Text variant="caption" tone="secondary">You’re owed</Text>
          <Text variant="title2" tone={owedToYou > 0 ? 'success' : 'primary'}>{`$${owedToYou.toFixed(2)}`}</Text>
        </Card>
        <Card style={styles.summaryTile}>
          <Text variant="caption" tone="secondary">You owe</Text>
          <Text variant="title2" tone={youOwe > 0 ? 'danger' : 'primary'}>{`$${youOwe.toFixed(2)}`}</Text>
        </Card>
      </View>

      {hasFriendRequests && (
        <Card padded={false} style={{ marginTop: space.lg }}>
          <ListRow
            title={`${friendRequestUIDs.length} friend request${friendRequestUIDs.length === 1 ? '' : 's'}`}
            subtitle="Review who wants to split trips with you"
            separator={false}
            leading={(
              <View style={styles.requestIcon}>
                <Ionicons name="mail-unread-outline" size={20} color={color.primaryText} />
              </View>
            )}
            chevron
            onPress={() => validateCurrentUser(user) && openFriendRequests()}
          />
        </Card>
      )}

      <SectionHeader title="Balances" />
      <Table
        data={formattedBalances}
        Row={MyRow}
        loading={loadingFriends}
        emptyState={friendsEmptyState}
      />
      {!loadingFriends && formattedBalances.length > 0 && (
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
          Swipe left on a friend to remove them.
        </Text>
      )}

      {isFeatureEnabled('splitwise_screen') && (
      <SegmentedControl
        style={styles.toggle}
        options={[
          { value: 'GasMeUp', label: 'GasMeUp' },
          { value: 'Splitwise', label: 'Splitwise' },
        ]}
        onChange={(value) => (value === 'Splitwise' ? navigation.replace('Splitwise') : null)}
        value="GasMeUp"
      />
      )}
    </Page>
  );
}
