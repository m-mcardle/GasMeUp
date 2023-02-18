// TODO
// Only add friends by email
// Send friend request instead of adding them directly

// React
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import uuid from 'react-native-uuid';

// Firebase
import { doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../firebase';

// Components
import Input from '../Input';
import Text from '../Text';
import Button from '../Button';

// Helpers
import { maybeValidEmail } from '../../helpers/emailHelper';
import { updateFriend } from '../../helpers/firestoreHelper';

// Styles
import { colors, globalStyles } from '../../styles/styles';

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
  const userFriendRequests = Object.keys(userFriends ?? {}).filter((uid) => userFriends[uid].status === 'outgoing').map((uid) => userFriends[uid]);

  const validEmail = maybeValidEmail(friendEmail);

  const closeModal = () => {
    setInputError(false);
    close();
    Alert.alert('Friend Request Sent', `If a user exists with the email: "${friendEmail}", they will receive a friend request.`);
  };

  // THIS NEEDS TO BE FIXED SO THAT WE CAN KEEP THE SECURE FIRESTORE RULES
  // Need a way to add a friend without searching for them on the front-end
  // Dumb idea - randomly generate temporary UID, then the function searches for friend
  const sendFriendRequest = useCallback(async () => {
    if (!currentUser?.uid || !validEmail) {
      return;
    }
    const email = friendEmail.toLowerCase();
    const existingFriend = userFriendRequests.find((friend) => friend.email === email);

    if (existingFriend?.accepted) {
      Alert.alert('Error Sending Friend Request', 'Friend already added');
      setInputError(true);
      return;
    }

    if (existingFriend) {
      Alert.alert('Error Sending Friend Request', 'Friend request already sent');
      setInputError(true);
      return;
    }

    if (email === currentUser.email) {
      Alert.alert('Error Sending Friend Request', 'Cannot send friend request to yourself');
      setInputError(true);
      return;
    }

    try {
      await updateFriend(currentUser.uid, `TEMP_${uuid.v4().toString()}`, {
        status: 'outgoing',
        accepted: false,
        balance: 0,
        email,
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
