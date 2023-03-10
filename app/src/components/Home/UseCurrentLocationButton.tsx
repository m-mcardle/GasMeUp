// React imports
import React from 'react';

import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  onPress: () => void,
  color: string,
  disabled: boolean,
}

export default function UseCurrentLocationButton({ color, disabled, onPress }: Props) {
  return (
    <MaterialIcons
      name="my-location"
      size={30}
      color={color}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
