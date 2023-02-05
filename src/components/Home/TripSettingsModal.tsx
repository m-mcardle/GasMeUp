// React
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import Checkbox from 'expo-checkbox';

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
    <>
      <Text style={globalStyles.title}>Select Driver</Text>
      <Text style={globalStyles.h2}>This determines who is owed the money for this trip</Text>
      <View style={{ marginTop: 24 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => setDriver(userDocument!)}>
          <Checkbox
            value={isDriver(userDocument!)}
            onValueChange={() => setDriver(userDocument!)}
            color={colors.action}
            style={{ marginHorizontal: 4 }}
          />
          <Text>
            {`You - ${userDocument?.firstName} ${userDocument?.lastName}`}
          </Text>
        </TouchableOpacity>
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
              Riders Pay All
            </Text>
          </Button>
          <Text style={{ ...globalStyles.smallText, textAlign: 'center' }}>
            {`$${ridersCost.toFixed(2)} each`}
          </Text>
        </View>
      </View>
    </>
  );
}
