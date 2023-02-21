// React
import React, { useCallback, useRef } from 'react';
import { Animated, Alert, Image } from 'react-native';

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
import { getIcon } from '../../helpers/iconHelper';

// Components
import Text from '../Text';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors } from '../../styles/styles';

interface Props {
  email: string,
  name: string,
  amount: number,
  uid: string,
  onPress: Function,
}

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export default function Row({
  name, amount, uid, onPress, email,
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
          uid,
          name,
          amount,
          email,
        })}
      >
        <DataTable.Cell style={{ maxWidth: '15%', justifyContent: 'center', alignContent: 'center' }}>
          <Image
            style={{ width: 32, height: 32, borderRadius: 64 }}
            source={getIcon({ email, name })}
          />
        </DataTable.Cell>
        <DataTable.Cell textStyle={{ color: colors.secondary }}>
          {name}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          <Text style={amount < 0 ? { color: 'red' } : { color: colors.secondary }}>
            $
            {amount < 0 ? (amount * -1).toFixed(2) : amount.toFixed(2)}
          </Text>
        </DataTable.Cell>
      </DataTable.Row>
    </Swipeable>
  );
}
