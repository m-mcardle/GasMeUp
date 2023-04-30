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
  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'ios-square';

  switch (name) {
    case 'Home':
      iconName = focused
        ? 'ios-calculator'
        : 'ios-calculator-outline';
      break;
    case 'Friends/Login':
      iconName = focused
        ? 'ios-people'
        : 'ios-people-outline';
      break;
    case 'Car':
      iconName = focused
        ? 'ios-car'
        : 'ios-car-outline';
      break;
    case 'Gas Prices':
      return <FontAwesome5 name="gas-pump" size={size} color={color} />;
    default:
      iconName = 'ios-square';
  }

  return (
    <Ionicons name={iconName} size={size} color={color} />
  );
}
