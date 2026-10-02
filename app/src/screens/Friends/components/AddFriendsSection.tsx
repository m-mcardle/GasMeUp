// TODO
// Only add friends by email
// Send friend request instead of adding them directly

// React
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import uuid from 'react-native-uuid';

// Firebase
import { doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db, auth } from '../../../../firebase';

// Components
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Alert from '../../../components/Alert';

// Helpers
import { maybeValidEmail } from '../../../helpers/emailHelper';
import { updateFriend } from '../../../helpers/firestoreHelper';
import { logEvent } from '../../../helpers/analyticsHelper';

// Styles
import { space } from '../../../styles/theme';

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
    Alert('Request sent', `If ${friendEmail} has a GasMeUp account, they’ll get your friend request.`);
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
    <View style={{ gap: space.lg }}>
      <Input
        label="Friend’s email"
        placeholder="friend@example.com"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="send"
        value={friendEmail}
        onChangeText={(text) => {
          setInputError(false);
          setFriendEmail(text);
        }}
        onSubmitEditing={sendFriendRequest}
        error={inputError}
        clearButton
      />
      <Button
        title="Send request"
        icon="paper-plane"
        fullWidth
        disabled={!validEmail}
        onPress={sendFriendRequest}
      />
    </View>
  );
}
