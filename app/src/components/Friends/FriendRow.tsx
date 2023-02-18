// React
import React, { useCallback, useRef } from 'react';
import { Animated, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Swipeable, RectButton } from 'react-native-gesture-handler';

import {
  DataTable,
} from 'react-native-paper';

// Firebase
import {
  doc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';

// Components
import Text from '../Text';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors } from '../../styles/styles';

interface Props {
  name: string,
  amount: number,
  uid: string,
  onPress: Function,
}

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export default function Row({
  name, amount, uid, onPress,
}: Props) {
  const [user] = useAuthState(auth);
  const ref = useRef<Swipeable>(null);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-500, 0],
      outputRange: [1, 0.25],
      extrapolate: 'clamp',
    });

    return (
      <RectButton
        style={styles.rightAction}
      >
        <AnimatedIcon
          name="remove-circle-outline"
          size={30}
          color="red"
          style={[styles.actionIcon, { transform: [{ scale }] }]}
        />
      </RectButton>
    );
  };

  const removeFriend = useCallback(async () => {
    if (!user?.uid || !userDoc) {
      return;
    }
    try {
      const newFriendsList = userDocument?.friends;
      delete newFriendsList[uid];

      await updateDoc(userDoc, {
        friends: {
          ...newFriendsList,
        },
      });
    } catch (exception) {
      console.log(exception);
    }
  }, [userDocument, userDoc, user?.uid, uid]);

  const showRemoveConfirmationAlert = () => Alert.alert(
    'Remove Friend',
    `Are you sure you want to remove ${name} from your list of friends?`,
    [
      {
        text: 'OK',
        onPress: () => removeFriend(),
        style: 'default',
      },
      {
        text: 'Cancel',
        onPress: () => ref?.current?.close(),
        style: 'cancel',
      },
    ],
  );

  return (
    <Swipeable
      ref={ref}
      onSwipeableOpen={() => showRemoveConfirmationAlert()}
      renderRightActions={renderRightActions}
      friction={2}
      overshootFriction={10}
      rightThreshold={75}
    >
      <DataTable.Row
        key={name}
        onPress={() => validateCurrentUser(user) && onPress({
          selectedFriendUID: uid,
          selectedFriendName: name,
          selectedFriendAmount: amount,
        })}
      >
        <DataTable.Cell textStyle={{ color: colors.secondary }}>
          {name}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          <Text style={amount < 0 ? { color: 'red' } : { color: colors.secondary }}>
            $
            {amount.toFixed(2)}
          </Text>
        </DataTable.Cell>
      </DataTable.Row>
    </Swipeable>
  );
}
