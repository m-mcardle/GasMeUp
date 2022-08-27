// React
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, updateDoc, query, where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Screens
import Text from '../Text';

// Styles
import { globalStyles } from '../../styles/styles';

const usersRef = collection(db, 'Users');

export default function AddFriendsTable() {
  const itemsPerPage = 5;
  const [page, setPage] = useState(0);
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};

  // Do not include current user and friends in the Add Friends table
  const friendsUIDs = userDocument?.friends ? Object.keys(userDocument.friends) : [];
  const excludedUIDS = currentUser ? [...friendsUIDs, currentUser.uid] : undefined;

  const usersQuery = excludedUIDS ? query(usersRef, where('__name__', 'not-in', excludedUIDS)) : undefined;
  const [usersData = [], , errorUsersDB] = useCollectionData(usersQuery);

  const addToFriendsList = useCallback(async (newFriend) => {
    if (!currentUser?.uid) {
      return;
    }
    try {
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        friends: {
          ...userFriends,
          [newFriend.uid]: 0,
        },
      });
    } catch (exception) {
      console.log(exception);
    }
  }, [userDocument, currentUser, userFriends]);

  const pageUserData = usersData.length
    ? usersData.slice((page * itemsPerPage), ((page + 1) * itemsPerPage))
    : [];

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  const pageStart = page * itemsPerPage + 1;
  const pageEnd = (page + 1) * itemsPerPage;
  const numberOfPages = Number(((usersData.length) / itemsPerPage).toFixed(0));

  return (
    <View>
      <Text style={globalStyles.title}>Add Friends</Text>
      <DataTable style={globalStyles.table}>

        <DataTable.Header>
          <DataTable.Title>Friend</DataTable.Title>
          <DataTable.Title numeric>Add Friend</DataTable.Title>
        </DataTable.Header>

        {
          userDocument
            ? pageUserData.map((user) => (
              <DataTable.Row
                key={user.firstName + user.lastName + user.uid}
                onPress={() => { addToFriendsList(user); }}
              >
                <DataTable.Cell>{`${user.firstName} ${user.lastName}`}</DataTable.Cell>
                <DataTable.Cell numeric>
                  +
                </DataTable.Cell>
              </DataTable.Row>
            ))
            : undefined
        }

        <DataTable.Pagination
          page={page}
          numberOfPages={numberOfPages}
          onPageChange={setPage}
          label={`${pageStart}-${Math.min(pageEnd, usersData.length)} of ${usersData.length}`}
          selectPageDropdownLabel="Rows per page"
          numberOfItemsPerPage={itemsPerPage}
        />

      </DataTable>
    </View>
  );
}
