// React
import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Swipeable, RectButton } from 'react-native-gesture-handler';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../firebase';

// Helpers
import { validateCurrentUser } from '../../../helpers/authHelper';
import { removeFriend } from '../../../helpers/firestoreHelper';
import { logEvent } from '../../../helpers/analyticsHelper';

// Components
import Alert from '../../../components/Alert';
import Avatar from '../../../components/Avatar';
import ListRow from '../../../components/ListRow';
import Text from '../../../components/Text';

// Styles
import { color, space } from '../../../styles/theme';

interface Props {
  email: string,
  name: string,
  amount: number,
  uid: string,
  isLast?: boolean,
  onPress: Function,
}

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
    backgroundColor: color.danger,
  },
  amount: {
    alignItems: 'flex-end',
  },
});

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export function balanceLabel(amount: number) {
  if (Math.abs(amount) < 0.005) {
    return { label: 'Settled up', tone: 'tertiary' as const };
  }
  return amount > 0
    ? { label: 'Owes you', tone: 'success' as const }
    : { label: 'You owe', tone: 'danger' as const };
}

export default function Row({
  name, amount, uid, onPress, email, isLast = false,
}: Props) {
  const [user] = useAuthState(auth);
  const ref = useRef<Swipeable>(null);

  const handleRemovedFriend = (friendUid: string) => {
    logEvent('removed_friend');
    removeFriend(uid, friendUid);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.rightAction}>
        <AnimatedIcon
          name="person-remove"
          size={22}
          color="#FFFFFF"
          style={{ transform: [{ scale }] }}
        />
      </RectButton>
    );
  };

  const showRemoveConfirmationAlert = () => (user?.uid && uid
    ? Alert(
      'Remove friend?',
      `${name} will be removed from your friends list.`,
      [
        {
          text: 'Remove',
          onPress: () => handleRemovedFriend(uid),
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

  const { label, tone } = balanceLabel(amount);
  const settled = tone === 'tertiary';

  return (
    <Swipeable
      ref={ref}
      onSwipeableOpen={() => showRemoveConfirmationAlert()}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
      rightThreshold={60}
    >
      <ListRow
        title={name}
        subtitle={label}
        separator={!isLast}
        leading={<Avatar name={name} email={email} />}
        style={{ backgroundColor: color.surface }}
        chevron
        trailing={settled ? undefined : (
          <Text variant="headline" tone={tone} style={{ marginRight: space.xxs }}>
            {`$${Math.abs(amount).toFixed(2)}`}
          </Text>
        )}
        onPress={() => validateCurrentUser(user) && onPress({
          uid,
          name,
          amount,
          email,
        })}
      />
    </Swipeable>
  );
}
