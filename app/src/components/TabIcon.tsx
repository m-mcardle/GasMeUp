import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  const iconSize = size - 2;
  switch (name) {
    case 'Home':
      return <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={iconSize} color={color} />;
    case 'Friends/Login':
      return <Ionicons name={focused ? 'people' : 'people-outline'} size={iconSize} color={color} />;
    case 'Car':
      return <Ionicons name={focused ? 'car-sport' : 'car-sport-outline'} size={iconSize} color={color} />;
    case 'Gas Prices':
      return <MaterialCommunityIcons name={focused ? 'gas-station' : 'gas-station-outline'} size={iconSize} color={color} />;
    default:
      return <Ionicons name="square-outline" size={iconSize} color={color} />;
  }
}
