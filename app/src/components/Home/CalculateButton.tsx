// React imports
import React from 'react';

// Components
import Text from '../Text';
import Button from '../Button';

// Styles
import { colors } from '../../styles/styles';
import styles from '../../styles/HomeScreen.styles';

interface Props {
  onPress: () => void,
  disabled: boolean,
}

export default function SaveTripButton({ onPress, disabled }: Props) {
  return (
    <Button
      style={styles.calculateButton}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={{ color: colors.secondary, textAlign: 'center' }}>Calculate</Text>
    </Button>
  );
}
