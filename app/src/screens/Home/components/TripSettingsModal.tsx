// React
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  DocumentData,
} from 'firebase/firestore';

// Components
import Text from '../../../components/Text';
import Avatar from '../../../components/Avatar';
import ListRow from '../../../components/ListRow';
import SectionHeader from '../../../components/SectionHeader';

// Styles
import { color, radius, space } from '../../../styles/theme';

interface User {
  uid: string | number,
  firstName: string,
  lastName: string,
  email: string,
}

interface Props {
  cost: number,
  currentUser: User,
  selectedFriends: Array<User>,
  saveTrip: (
    friends: Array<User>,
    driver: User,
    splitType: 'split' | 'full',
  ) => void,
  closeModal: () => void,
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  options: {
    flexDirection: 'row',
    gap: space.md,
  },
  option: {
    flex: 1,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    gap: space.xs,
  },
  optionPressed: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  optionDisabled: {
    opacity: 0.4,
  },
});

function Radio({ selected }: { selected: boolean }) {
  return (
    <Ionicons
      name={selected ? 'radio-button-on' : 'radio-button-off'}
      size={22}
      color={selected ? color.primaryText : color.textTertiary}
    />
  );
}

function SplitOption({
  title, amount, caption, disabled, onPress,
}: { title: string, amount: string, caption: string, disabled: boolean, onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${amount} ${caption}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        pressed ? styles.optionPressed : null,
        disabled ? styles.optionDisabled : null,
      ]}
    >
      <Text variant="callout" tone="secondary">{title}</Text>
      <Text variant="title2">{amount}</Text>
      <Text variant="caption" tone="tertiary">{caption}</Text>
    </Pressable>
  );
}

export default function TripSettingsModal({
  cost, selectedFriends, currentUser, saveTrip, closeModal,
}: Props) {
  const [driver, setDriver] = useState<User>({
    uid: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  // Everyone except the driver is a rider. With no riders, "only riders pay" would divide by zero.
  const riderCount = selectedFriends.length;
  const evenSplitCost = cost / (riderCount + 1);
  const ridersCost = riderCount > 0 ? cost / riderCount : null;
  const isDriver = (friend: DocumentData) => friend.uid === driver.uid;
  const people = [currentUser, ...selectedFriends];

  const choose = (splitType: 'split' | 'full') => {
    saveTrip(selectedFriends, driver, splitType);
    closeModal();
  };

  return (
    <View>
      <View style={styles.list}>
        {people.map((person, index) => {
          const name = `${person?.firstName} ${person?.lastName}`;
          const isYou = index === 0;
          return (
            <ListRow
              key={person.uid}
              title={isYou ? `${name} (you)` : name}
              separator={index < people.length - 1}
              leading={<Avatar name={name} email={person.email} size={36} />}
              trailing={<Radio selected={isDriver(person)} />}
              accessibilityLabel={`${name} drove`}
              onPress={() => setDriver(person)}
            />
          );
        })}
      </View>

      <SectionHeader title="How do you want to split it?" />
      <View style={styles.options}>
        <SplitOption
          title="Split evenly"
          amount={`$${evenSplitCost.toFixed(2)}`}
          caption="each, driver included"
          disabled={!driver.uid}
          onPress={() => choose('split')}
        />
        <SplitOption
          title="Riders pay"
          amount={ridersCost === null ? '—' : `$${ridersCost.toFixed(2)}`}
          caption="per rider, driver free"
          disabled={!driver.uid || ridersCost === null}
          onPress={() => choose('full')}
        />
      </View>
      <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
        {driver.uid ? `Trip total $${cost.toFixed(2)}` : 'Pick who drove to continue.'}
      </Text>
    </View>
  );
}
