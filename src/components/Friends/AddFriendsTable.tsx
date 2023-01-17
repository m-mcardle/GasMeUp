// React
import React, { useCallback } from 'react';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, updateDoc, query, where, DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Table from '../Table';

function RowBuilder(addToFriendsList: Function) {
  function Row({ firstName, lastName, uid }: DocumentData) {
    const user = { firstName, lastName, uid };
    return (
      <DataTable.Row
        key={firstName + lastName + uid}
        onPress={() => { addToFriendsList(user); }}
      >
        <DataTable.Cell>{`${firstName} ${lastName}`}</DataTable.Cell>
        <DataTable.Cell numeric>
          +
        </DataTable.Cell>
      </DataTable.Row>
    );
  }

  return Row;
}

const usersRef = collection(db, 'Users');

export default function AddFriendsTable() {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};

  // Do not include current user and friends in the Add Friends table
  const friendsUIDs = userDocument?.friends ? Object.keys(userDocument.friends) : [];
  const excludedUIDS = currentUser ? [...friendsUIDs, currentUser.uid] : undefined;

  const usersQuery = excludedUIDS ? query(usersRef, where('__name__', 'not-in', excludedUIDS)) : undefined;
  const [usersData = [], , errorUsersDB] = useCollectionData(usersQuery);

  // Add key for each Row
  // eslint-disable-next-line no-param-reassign
  usersData.forEach((el) => { el.key = el.firstName + el.lastName + el.uid; });

  const addToFriendsList = useCallback(async (newFriend: DocumentData) => {
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

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  const headers = [
    { text: 'Friend', numeric: false },
    { text: 'Add Friend', numeric: true },
  ];

  return (
    <Table
      title="Add Friends"
      data={usersData}
      itemsPerPage={5}
      headers={headers}
      Row={RowBuilder(addToFriendsList)}
    />
  );
}
