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
import { colors } from '../../styles/styles';

interface Props {
  friendRequestUIDs: string[],
  closeModal: () => void,
}

interface FriendObject {
  email: string,
  uid: string,
}

// const usersRef = collection(db, 'Users');

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
          return { email: data.email, uid: document.id };
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

    console.log(userFriends);
    console.log(friendUID);

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
    <View>
      <Text style={styles.friendInfoTitle}>Friend Requests</Text>
      {friendRequests.map((request: FriendObject) => (
        <View
          key={request.uid}
          style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}
        >
          <Text>{request.email}</Text>
          <Button
            style={{ paddingHorizontal: 16, paddingVertical: 4 }}
            onPress={() => acceptFriendRequest(request.uid)}
          >
            <Ionicons name="checkmark" size={14} color={colors.white} />
          </Button>
        </View>
      ))}
    </View>
  );
}
