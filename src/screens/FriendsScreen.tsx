// React
import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { DataTable } from 'react-native-paper';

// Firebase
import {
  collection, doc, query, where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../firebase';

// Screens
import LoginScreen from './LoginScreen';

const usersRef = collection(db, 'Users');

export default function FriendsScreen() {
  const [user, loading, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const balances = userDocument ? userDocument.friends : undefined;
  const friendsUIDs = balances ? Object.keys(balances) : undefined;

  const friendsQuery = friendsUIDs?.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [friendsData, , errorFriendsDB] = useCollectionData(friendsQuery);

  const formattedBalances = friendsData ? friendsUIDs?.map((uid: string) => {
    const currentFriend = friendsData?.find((friend) => friend.uid === uid);
    return {
      name: `${currentFriend?.firstName} ${currentFriend?.lastName}`, amount: balances[uid],
    };
  }) : undefined;

  if (errorUserDB || errorFriendsDB || error) {
    console.log(errorUserDB, errorFriendsDB, error);
  }

  if (!user || loading || error) {
    return (
      <LoginScreen />
    );
  }

  return (
    <View>
      <DataTable style={{ height: '70%' }}>

        <DataTable.Header>
          <DataTable.Title>Friend</DataTable.Title>
          <DataTable.Title numeric>Amount Owed</DataTable.Title>
        </DataTable.Header>

        {
          formattedBalances?.map((balance) => (
            <DataTable.Row key={balance.name}>
              <DataTable.Cell>{balance.name}</DataTable.Cell>
              <DataTable.Cell numeric>
                $
                {balance.amount}
              </DataTable.Cell>
            </DataTable.Row>
          ))
        }

        <DataTable.Pagination
          page={0}
          numberOfPages={2}
          onPageChange={() => {}}
          label="1-4 of 4"
          selectPageDropdownLabel="Rows per page"
        />

      </DataTable>
    </View>
  );
}

FriendsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
