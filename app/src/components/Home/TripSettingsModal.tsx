// React
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import Checkbox from 'expo-checkbox';
import { Divider } from 'react-native-paper';

// Firebase
import {
  DocumentData,
} from 'firebase/firestore';

// Components
import Text from '../Text';
import Button from '../Button';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

interface Props {
  cost: number,
  userDocument: DocumentData,
  selectedFriends: Array<DocumentData>,
  saveTrip: (
    friends: Array<DocumentData>,
    driver: DocumentData,
    splitType: 'split' | 'full',
  ) => void,
  closeModal: () => void,
}

export default function TripSettingsModal({
  cost, selectedFriends, userDocument, saveTrip, closeModal,
}: Props) {
  const [driver, setDriver] = useState<DocumentData>({});

  const evenSplitCost = cost / (selectedFriends.length + 1);
  const ridersCost = cost / selectedFriends.length;
  const isDriver = (friend: DocumentData) => friend.uid === driver.uid;
  return (
    <View style={{ height: '100%', width: '100%', padding: 12 }}>
      <Text style={globalStyles.h1}>Select Driver</Text>
      <Text style={globalStyles.h2}>This determines who is owed the money for this trip</Text>
      <Text style={{ ...globalStyles.h1, marginTop: 12 }}>{`Total: $${cost.toFixed(2)}`}</Text>
      <View style={{ marginTop: 24, marginLeft: 'auto', marginRight: 'auto' }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => setDriver(userDocument!)}>
          <Checkbox
            value={isDriver(userDocument!)}
            onValueChange={() => setDriver(userDocument!)}
            color={colors.action}
            style={{ marginHorizontal: 4 }}
          />
          <Text>
            {`${userDocument?.firstName} ${userDocument?.lastName} (You)`}
          </Text>
        </TouchableOpacity>
        <Divider />
        {selectedFriends.map((friend: DocumentData) => (
          <TouchableOpacity key={friend.uid} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => setDriver(friend)}>
            <Checkbox
              value={isDriver(friend)}
              onValueChange={() => setDriver(friend)}
              color={colors.action}
              style={{ marginHorizontal: 4 }}
            />
            <Text>
              {`${friend.firstName} ${friend.lastName}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.saveTripButtonSection}>
        <View>
          <Button
            disabled={!driver.uid}
            style={styles.addToFriendButton}
            onPress={() => {
              saveTrip(selectedFriends, driver, 'split');
              closeModal();
            }}
          >
            <Text style={globalStyles.smallText}>
              Split Evenly
            </Text>
          </Button>
          <Text style={{ ...globalStyles.smallText, textAlign: 'center' }}>
            {`$${(evenSplitCost).toFixed(2)} each`}
          </Text>
        </View>
        <View>
          <Button
            disabled={!driver.uid}
            style={styles.addToFriendButton}
            onPress={() => {
              saveTrip(selectedFriends, driver, 'full');
              closeModal();
            }}
          >
            <Text style={globalStyles.smallText}>
              Only Riders Pay
            </Text>
          </Button>
          <Text style={{ ...globalStyles.smallText, textAlign: 'center' }}>
            {`$${ridersCost.toFixed(2)} per rider`}
          </Text>
        </View>
      </View>
    </View>
  );
}
