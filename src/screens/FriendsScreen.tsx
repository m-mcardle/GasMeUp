// React
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  DataTable, Provider, Portal, Modal,
} from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../firebase';

// Screens
import LoginScreen from './LoginScreen';

// Components
import Text from '../components/Text';

import AddFriendsTable from '../components/Friends/AddFriendsTable';

// Styles
import styles from '../styles/FriendsScreen.styles';
import { globalStyles } from '../styles/styles';

const usersRef = collection(db, 'Users');

export default function FriendsScreen() {
  const itemsPerPage = 5;
  const [page, setPage] = useState(0);
  const [user, loading, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const balances = userDocument ? userDocument.friends : undefined;
  const friendsUIDs = balances ? Object.keys(balances) : undefined;

  const friendsQuery = friendsUIDs?.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [friendsData, friendsDataLoading, errorFriendsDB] = useCollectionData(friendsQuery);

  const formattedBalances = friendsData && !friendsDataLoading && friendsUIDs
    ? friendsUIDs.map((uid: string) => {
      const currentFriend = friendsData.find((friend) => friend.uid === uid);

      // If the current friend cannot be found then set as an empty element
      // This occurs when a new friend is added for some reason...
      // We filter these elements out after the map() with filter()
      if (!currentFriend?.firstName) {
        return null;
      }
      return {
        name: `${currentFriend?.firstName} ${currentFriend?.lastName}`, amount: balances[uid],
      };
    }).filter((el) => el) : [];

  const [visible, setVisible] = useState(false);

  if (errorUserDB || errorFriendsDB || error) {
    console.log(errorUserDB, errorFriendsDB, error);
  }

  const pageStart = page * itemsPerPage + 1;
  const pageEnd = (page + 1) * itemsPerPage;
  const numberOfPages = Number(((formattedBalances.length) / itemsPerPage).toFixed(0));

  if (!user || loading || error) {
    return (
      <LoginScreen />
    );
  }

  return (
    <Provider>
      <View style={styles.main}>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible((state) => !state)}
            contentContainerStyle={globalStyles.modal}
          >
            <AddFriendsTable />
          </Modal>
        </Portal>
        <Text style={globalStyles.title}>Friends</Text>
        <DataTable style={styles.table}>

          <DataTable.Header>
            <DataTable.Title>Friend</DataTable.Title>
            <DataTable.Title numeric>Amount Owed</DataTable.Title>
          </DataTable.Header>

          {
          !friendsDataLoading && userDocument
            ? formattedBalances.map((balance) => (balance ? (
              <DataTable.Row key={balance.name}>
                <DataTable.Cell>{balance.name}</DataTable.Cell>
                <DataTable.Cell textStyle={balance.amount < 0 ? { color: 'red' } : undefined} numeric>
                  $
                  {balance.amount}
                </DataTable.Cell>
              </DataTable.Row>
            ) : undefined))
            : undefined
          }
          <DataTable.Row onPress={() => setVisible((state) => !state)}>
            <DataTable.Cell>Add Friend</DataTable.Cell>
            <DataTable.Cell numeric>
              +
            </DataTable.Cell>
          </DataTable.Row>

          <DataTable.Pagination
            page={page}
            numberOfPages={numberOfPages}
            onPageChange={setPage}
            label={`${pageStart}-${Math.min(pageEnd, formattedBalances.length)} of ${formattedBalances.length}`}
            selectPageDropdownLabel="Rows per page"
            numberOfItemsPerPage={itemsPerPage}
          />

        </DataTable>
      </View>
    </Provider>
  );
}
