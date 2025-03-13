import React from 'react';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface TabIconProps {
  name: string,
  focused: boolean,
  color: string,
  size: number
}

export default function TabIcon({
  name,
  focused,
  color,
  size,
} : TabIconProps) {
  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'square';

  switch (name) {
    case 'Home':
      iconName = focused
        ? 'calculator'
        : 'calculator-outline';
      break;
    case 'Friends/Login':
      iconName = focused
        ? 'people'
        : 'people-outline';
      break;
    case 'Car':
      iconName = focused
        ? 'car'
        : 'car-outline';
      break;
    case 'Gas Prices':
      return <FontAwesome5 name="gas-pump" size={size} color={color} />;
    default:
      iconName = 'square';
  }

  return (
    <Ionicons name={iconName} size={size} color={color} />
  );
}
