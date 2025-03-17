// React imports
import React from 'react';

import { Ionicons } from '@expo/vector-icons';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';

// Styles
import { colors } from '../../../styles/styles';
import styles from '../../../styles/HomeScreen.styles';

interface Props {
  onPress: () => void,
  disabled: boolean,
}

export default function ClearManualTripButton({ onPress, disabled }: Props) {
  return (
    <Button
      style={{ ...styles.calculateButton, backgroundColor: colors.red }}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="close" size={12} color="white" />
      <Text>Clear Trip</Text>
    </Button>
  );
}
