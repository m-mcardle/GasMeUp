// React
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

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
import Avatar from '../../../components/Avatar';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import IconButton from '../../../components/IconButton';
import ListRow from '../../../components/ListRow';

// Styles
import { color, space } from '../../../styles/theme';

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

  if (friendRequestUIDs.length === 0) {
    return <EmptyState icon="mail-open-outline" title="You’re all caught up" message="No pending friend requests." />;
  }

  return (
    <Card padded={false} style={{ marginBottom: space.sm, backgroundColor: color.surfaceRaised }}>
      {friendRequests.map((request: FriendObject, index) => (
        <ListRow
          key={request.uid}
          title={request.fullName || request.email}
          subtitle={request.fullName !== request.email ? request.email : undefined}
          separator={index < friendRequests.length - 1}
          leading={<Avatar name={request.fullName || request.email} email={request.email} />}
          trailing={(
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <IconButton
                icon="close"
                variant="danger"
                size={36}
                accessibilityLabel={`Decline ${request.fullName}`}
                onPress={() => removeFriendRequest(request)}
              />
              <IconButton
                icon="checkmark"
                variant="success"
                size={36}
                accessibilityLabel={`Accept ${request.fullName}`}
                onPress={() => acceptFriendRequest(request)}
              />
            </View>
          )}
        />
      ))}
    </Card>
  );
}
