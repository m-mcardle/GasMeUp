// React
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  doc, DocumentData, getDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../../firebase';

// Helpers
import { updateFriend, removeFriend } from '../../../helpers/firestoreHelper';
import { logEvent } from '../../../helpers/analyticsHelper';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';

// Styles
import styles from '../../../styles/FriendsScreen.styles';
import { boldFont, colors, globalStyles } from '../../../styles/styles';

interface Props {
  friendRequestUIDs: string[],
  // Email stored on each request in the current user's `friends` map; shown when
  // the requester's user doc cannot be read (e.g. denied by security rules).
  friendEmails?: Record<string, string | undefined>,
  closeModal: () => void,
}

interface FriendObject {
  fullName: string,
  email: string,
  uid: string,
}

export default function FriendRequestsSection({
  friendRequestUIDs, friendEmails = {}, closeModal,
} : Props) {
  const [currentUser] = useAuthState(auth);
  const [friendRequests, setFriendRequests] = useState<FriendObject[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const requests = await Promise.all(friendRequestUIDs.map(async (uid: string) => {
        const fallbackEmail = friendEmails[uid] ?? '';
        try {
          const document: DocumentData = await getDoc(doc(db, 'Users', uid));
          const data = document.data();
          if (data) {
            return {
              fullName: `${data.firstName} ${data.lastName}`,
              email: data.email ?? fallbackEmail,
              uid,
            };
          }
        } catch (exception) {
          console.log(exception);
        }
        return { fullName: fallbackEmail, email: fallbackEmail, uid };
      }));

      setFriendRequests(requests);
    }
    fetchUsers();

    return () => {
    };
  }, [friendRequestUIDs]);

  const acceptFriendRequest = async (friend: FriendObject) => {
    if (!currentUser) {
      return;
    }

    logEvent('accepted_friend_request');

    try {
      await updateFriend(currentUser.uid, friend.uid, {
        status: 'accepted',
        accepted: true,
        balance: 0,
        email: friend.email,
      });
      closeModal();
    } catch (exception) {
      console.log(exception);
    }
  };

  const removeFriendRequest = async (friend: FriendObject) => {
    if (!currentUser) {
      return;
    }

    logEvent('removed_friend_request');

    try {
      await removeFriend(currentUser.uid, friend.uid);
      closeModal();
    } catch (exception) {
      console.log(exception);
    }
  };

  return (
    <View style={{ height: '100%' }}>
      <Text style={styles.friendInfoTitle}>Friend Requests</Text>
      <Text style={globalStyles.h2}>
        Add these users as friends and begin sharing trips with them!
      </Text>
      <View style={{ height: '80%', marginTop: 20 }}>
        <View
          style={styles.friendRequestsSection}
        >
          <Text style={{ fontFamily: boldFont, ...globalStyles.h3, width: '40%' }}>Name</Text>
          <Text style={{ fontFamily: boldFont, ...globalStyles.h3, width: '40%' }}>Email</Text>
          <View
            style={styles.acceptFriendRequestButton}
          />
        </View>
        {friendRequests.map((request: FriendObject) => (
          <View
            key={request.uid}
            style={styles.friendRequestsSection}
          >
            <Text style={{ ...globalStyles.h3, width: '40%' }} numberOfLines={1}>{request.fullName}</Text>
            <Text style={{ ...globalStyles.h3, width: '40%' }} numberOfLines={1}>{request.email}</Text>
            <Button
              style={styles.acceptFriendRequestButton}
              onPress={() => acceptFriendRequest(request)}
            >
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </Button>
            <Button
              style={styles.removeFriendRequestButton}
              onPress={() => removeFriendRequest(request)}
            >
              <Ionicons name="remove" size={14} color={colors.white} />
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}
