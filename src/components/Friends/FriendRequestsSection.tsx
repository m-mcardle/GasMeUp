// React
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  doc, DocumentData, getDoc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Components
import Text from '../Text';
import Button from '../Button';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { boldFont, colors, globalStyles } from '../../styles/styles';

interface Props {
  friendRequestUIDs: string[],
  closeModal: () => void,
}

interface FriendObject {
  fullName: string,
  email: string,
  uid: string,
}

export default function FriendRequestsSection({ friendRequestUIDs, closeModal } : Props) {
  const [currentUser] = useAuthState(auth);
  const [friendRequests, setFriendRequests] = useState<FriendObject[]>([]);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  useEffect(() => {
    async function fetchUsers() {
      const requests = (await Promise.all(friendRequestUIDs.map((request: string) => {
        const docRef = doc(db, 'Users', request);
        return getDoc(docRef);
      })))
        .map((document: DocumentData) => {
          const data = document.data();
          return { fullName: `${data.firstName} ${data.lastName}`, email: data.email, uid: document.id };
        });

      setFriendRequests(requests);
    }
    fetchUsers();

    return () => {
    };
  }, [friendRequestUIDs]);

  const userFriends = userDocument?.friends ?? {};

  const acceptFriendRequest = async (friendUID: string) => {
    if (!currentUser) {
      return;
    }

    try {
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        friends: {
          ...userFriends,
          [friendUID]: 0,
        },
      });
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
          <Text style={{ fontFamily: boldFont, ...globalStyles.h2 }}>Name</Text>
          <Text style={{ fontFamily: boldFont, ...globalStyles.h2 }}>Email</Text>
          <View
            style={styles.acceptFriendRequestButton}
          />
        </View>
        {friendRequests.map((request: FriendObject) => (
          <View
            key={request.uid}
            style={styles.friendRequestsSection}
          >
            <Text style={globalStyles.h2}>{request.fullName}</Text>
            <Text style={globalStyles.h2}>{request.email}</Text>
            <Button
              style={styles.acceptFriendRequestButton}
              onPress={() => acceptFriendRequest(request.uid)}
            >
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}
