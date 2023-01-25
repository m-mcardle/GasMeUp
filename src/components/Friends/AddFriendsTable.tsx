// TODO
// Only add friends by email
// Send friend request instead of adding them directly

// React
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  collection, doc, updateDoc, query, where, getDocs,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Input from '../Input';
import Text from '../Text';

// Styles
import { colors, globalStyles } from '../../styles/styles';

const usersRef = collection(db, 'Users');

export default function AddFriendsTable() {
  const [friendEmail, setFriendEmail] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};
  const userFriendRequests = userDocument?.outgoingFriendRequests ?? [];

  const sendFriendRequest = useCallback(async () => {
    if (!currentUser?.uid) {
      return;
    }

    const friendQuery = query(usersRef, where('email', '==', friendEmail));
    const querySnapshot = await getDocs(friendQuery);

    if (querySnapshot.empty) {
      console.log('Friend not found');
      setInputError(true);
      return;
    }
    const newFriend = querySnapshot.docs[0].data();

    if (userFriendRequests.includes(newFriend.uid) || userFriends[newFriend.uid] !== undefined) {
      console.log('Friend already added');
      setInputError(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        outgoingFriendRequests: [
          ...userFriendRequests,
          newFriend.uid,
        ],
      });
      setInputError(false);
    } catch (exception) {
      console.log(exception);
    }
  }, [userDocument, currentUser, userFriendRequests, userFriends, friendEmail]);

  return (
    <View style={globalStyles.centered}>
      <Text style={globalStyles.title}>
        Add Friend
      </Text>
      <Input
        placeholder="Friend's Email"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        value={friendEmail}
        onChangeText={setFriendEmail}
        onSubmitEditing={sendFriendRequest}
        icon={(<Ionicons name="person-add" size={24} color={colors.secondary} />)}
        error={inputError}
      />
    </View>
  );
}
