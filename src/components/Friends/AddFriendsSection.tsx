// TODO
// Only add friends by email
// Send friend request instead of adding them directly

// React
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

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
import Button from '../Button';

// Helpers
import { maybeValidEmail } from '../../helpers/emailHelper';

// Styles
import { colors, globalStyles } from '../../styles/styles';

const usersRef = collection(db, 'Users');

interface Props {
  close: () => void,
}

export default function AddFriendsTable({ close }: Props) {
  const [friendEmail, setFriendEmail] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const userFriends = userDocument?.friends ?? {};
  const userFriendRequests = Object.keys(userFriends ?? {}).filter((uid) => userFriends[uid].status === 'outgoing');

  const validEmail = maybeValidEmail(friendEmail);

  const closeModal = () => {
    setInputError(false);
    close();
    Alert.alert('Friend Request Sent', `If a user exists with the email: "${friendEmail}", they will receive a friend request.`);
  };

  // THIS NEEDS TO BE FIXED SO THAT WE CAN KEEP THE SECURE FIRESTORE RULES
  // IDEA: CHANGE FRIENDS TO BE A MAP OF MAPS
  // Each friend will have a current value and a 'accepted' value
  // Only show the 'accepted' friends in the UI
  // and tweak the Firebase Function to trigger on changes to the the 'accepted' value
  // LOL ^^ THIS WON'T EVEN WORK
  // Need a way to add a friend without searching for them on the front-end
  const sendFriendRequest = useCallback(async () => {
    if (!currentUser?.uid || !validEmail) {
      return;
    }

    const friendQuery = query(usersRef, where('email', '==', friendEmail));
    const querySnapshot = await getDocs(friendQuery);

    if (querySnapshot.empty) {
      // Treat friend not found the same as if the friend exists
      closeModal();
      return;
    }
    const newFriend = querySnapshot.docs[0].data();

    if (userFriendRequests.includes(newFriend.uid)) {
      Alert.alert('Error Sending Friend Request', 'Friend request already sent');
      setInputError(true);
      return;
    }

    if (userFriends[newFriend.uid].status === 'accepted') {
      Alert.alert('Error Sending Friend Request', 'Friend already added');
      setInputError(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        friends: {
          ...userFriends,
          [newFriend.uid]: {
            status: 'outgoing',
            accepted: false,
            balance: 0,
          },
        },
      });
      closeModal();
    } catch (exception) {
      console.log(exception);
    }
  }, [userDocument, currentUser, userFriendRequests, userFriends, friendEmail]);

  return (
    <View style={globalStyles.centered}>
      <Text style={globalStyles.h1}>
        Add Friend
      </Text>
      <Text style={globalStyles.h2}>
        Input your friends email to send them a friend request!
      </Text>
      <Input
        containerStyle={{ marginTop: 40 }}
        style={{ borderColor: 'white' }}
        placeholder="Friend's Email"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        value={friendEmail}
        onChangeText={setFriendEmail}
        onSubmitEditing={sendFriendRequest}
        icon={(<Ionicons name="person-add" size={24} color={colors.secondary} />)}
        error={inputError}
        clearButton
      />
      <Button
        disabled={!validEmail}
        onPress={sendFriendRequest}
      >
        <Text>
          Send
        </Text>
      </Button>
    </View>
  );
}
