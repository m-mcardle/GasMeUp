// React imports
import React from 'react';

import { AntDesign } from '@expo/vector-icons';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';

// Styles
import { colors } from '../../../styles/styles';
import styles from '../../../styles/HomeScreen.styles';

interface Props {
  onPress: () => void,
  canSaveTrip: boolean,
}

export default function SaveTripButton({ onPress, canSaveTrip }: Props) {
  return (
    <Button
      style={styles.saveButton}
      onPress={onPress}
      disabled={!canSaveTrip}
    >
      <AntDesign name="save" size={12} color={colors.secondary} />
      <Text
        style={styles.secondaryButtonText}
      >
        Save
      </Text>
    </Button>
  );
}
