// TODO
// Only add friends by email
// Send friend request instead of adding them directly

// React
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

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
import Alert from '../Alert';

// Helpers
import { maybeValidEmail } from '../../helpers/emailHelper';
import { updateFriend } from '../../helpers/firestoreHelper';
import { logEvent } from '../../helpers/analyticsHelper';

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
    logEvent('sent_friend_request');

    setInputError(false);
    close();
    Alert('Friend Request Sent', `If a user exists with the email: "${friendEmail}", they will receive a friend request.`);
  };

  const sendFriendRequest = useCallback(async () => {
    if (!currentUser?.uid || !validEmail) {
      return;
    }
    const email = friendEmail.toLowerCase();
    const existingFriend = userFriendRequests.find((friend) => friend.email === email);

    if (existingFriend?.accepted) {
      Alert('Error Sending Friend Request', 'Friend already added');
      setInputError(true);
      return;
    }

    if (existingFriend) {
      Alert('Error Sending Friend Request', 'Friend request already sent');
      setInputError(true);
      return;
    }

    if (email === currentUser.email) {
      Alert('Error Sending Friend Request', 'Cannot send friend request to yourself');
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
      <Text style={globalStyles.h3}>
        Input your friends email to send them a friend request!
      </Text>
      <Input
        viewStyle={{ marginTop: 40 }}
        style={{ borderColor: 'white' }}
        placeholder="Friend's Email"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        value={friendEmail}
        onChangeText={setFriendEmail}
        onSubmitEditing={sendFriendRequest}
        error={inputError}
        clearButton
      />
      <Button
        disabled={!validEmail}
        onPress={sendFriendRequest}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="person-add" size={24} color={colors.secondary} />
          <Text>
            Send
          </Text>
        </View>
      </Button>
    </View>
  );
}
