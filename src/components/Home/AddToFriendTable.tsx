// React
import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where, addDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Screens
import Text from '../Text';

// Styles
import { globalStyles } from '../../styles/styles';

const usersRef = collection(db, 'Users');

interface Props {
  cost: number,
  gasPrice: number,
  distance: number,
  riders: number,
  closeModal: Function,
}

export default function AddToFriendTable({
  cost, gasPrice, distance, riders, closeModal,
}: Props) {
  const itemsPerPage = 5;
  const [page, setPage] = useState(0);
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};
  const friendsUIDs = Object.keys(userFriends);

  const usersQuery = friendsUIDs.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [usersData = [], , errorUsersDB] = useCollectionData(usersQuery);

  const addCostToFriend = useCallback(async (friend) => {
    if (!currentUser?.uid) {
      return;
    }
    try {
      await addDoc(collection(db, 'Transactions'), {
        cost: Number(cost.toFixed(2)),
        amount: Number(cost.toFixed(2)) / riders,
        payeeUID: currentUser.uid,
        payerUID: friend.uid,
        distance,
        gasPrice,
        riders,
      });
      closeModal();
    } catch (exception) {
      console.log(exception);
    }
  }, [currentUser, cost, distance, gasPrice]);

  const pageStart = page * itemsPerPage + 1;
  const pageEnd = (page + 1) * itemsPerPage;
  const numberOfPages = Number(((usersData.length) / itemsPerPage).toFixed(0));

  const pageUserData = usersData.length
    ? usersData.slice((pageStart - 1), (pageEnd))
    : [];

  if (errorUsersDB) {
    console.log(errorUsersDB);
  }

  return (
    <View>
      <DataTable style={globalStyles.table}>

        <DataTable.Header>
          <DataTable.Title>Friend</DataTable.Title>
          <DataTable.Title numeric>Assign cost to Friend</DataTable.Title>
        </DataTable.Header>

        {
          userDocument
            ? pageUserData.map((user) => (
              <DataTable.Row key={user.firstName + user.lastName + user.uid}>
                <DataTable.Cell>{`${user.firstName} ${user.lastName}`}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <TouchableOpacity onPress={() => { addCostToFriend(user); }}>
                    <Text>+</Text>
                  </TouchableOpacity>
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
