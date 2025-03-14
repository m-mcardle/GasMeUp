// React imports
import React from 'react';

import { Ionicons } from '@expo/vector-icons';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';

// Styles
import { boldFont, colors } from '../../../styles/styles';
import styles from '../../../styles/HomeScreen.styles';

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
      <Ionicons name="calculator" size={12} color={colors.secondary} />
      <Text style={{ color: colors.secondary, textAlign: 'center', fontFamily: boldFont }}>Calculate</Text>
    </Button>
  );
}
