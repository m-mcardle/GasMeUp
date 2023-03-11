// React
import React, { useRef } from 'react';
import {
  View,
  Animated,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Swipeable, RectButton } from 'react-native-gesture-handler';

import {
  DataTable,
} from 'react-native-paper';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';
import { getIcon } from '../../helpers/iconHelper';
import { removeFriend } from '../../helpers/firestoreHelper';

// Components
import Text from '../Text';
import Alert from '../Alert';

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

  const showRemoveConfirmationAlert = () => (user?.uid && uid
    ? Alert(
      'Remove Friend',
      `Are you sure you want to remove ${name} from your list of friends?`,
      [
        {
          text: 'Remove',
          onPress: () => removeFriend(user?.uid, uid),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          onPress: () => ref?.current?.close(),
          style: 'cancel',
        },
      ],
    )
    : null);

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
          <View>
            <Image
              style={{ width: 32, height: 32, borderRadius: 64 }}
              source={getIcon({ email, name })}
            />
          </View>
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
