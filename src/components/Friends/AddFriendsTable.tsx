// React
import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

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
  const [usersData, , errorUsersDB] = useCollectionData(usersQuery);

  const addToFriendsList = useCallback(async (newFriend) => {
    console.log(newFriend);
    console.log(userFriends);
    console.log(userDocument);
    console.log({
      ...userFriends,
      [newFriend.uid]: 0,
    });
    console.log(currentUser?.uid);
    if (!currentUser?.uid) {
      return;
    }
    try {
      const response = await updateDoc(doc(db, 'Users', currentUser.uid), {
        friends: {
          ...userFriends,
          [newFriend.uid]: 0,
        },
      });
      console.log('Response:', response);
    } catch (exception) {
      console.log(exception);
    }
  }, [userDocument, currentUser, userFriends]);

  const pageUserData = usersData?.length
    ? usersData.slice((page * itemsPerPage), ((page + 1) * itemsPerPage))
    : [];

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  return (
    <View>
      <DataTable style={{ height: '70%' }}>

        <DataTable.Header>
          <DataTable.Title>Friend</DataTable.Title>
          <DataTable.Title numeric>Add Friend</DataTable.Title>
        </DataTable.Header>

        {
          userDocument
            ? pageUserData.map((user) => (
              <DataTable.Row key={user.firstName + user.lastName + user.uid}>
                <DataTable.Cell>{`${user.firstName} ${user.lastName}`}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <TouchableOpacity onPress={() => { addToFriendsList(user); }}>
                    <Text>+</Text>
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))
            : undefined
        }

        <DataTable.Pagination
          page={page}
          numberOfPages={(usersData?.length ?? 1) / itemsPerPage}
          onPageChange={setPage}
          label={`${page * itemsPerPage + 1}-${(page + 1) * itemsPerPage} of ${usersData?.length}`}
          selectPageDropdownLabel="Rows per page"
          numberOfItemsPerPage={itemsPerPage}
        />

      </DataTable>
    </View>
  );
}
