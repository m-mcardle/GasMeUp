import { StyleSheet } from 'react-native';
import type { StackNavigationOptions } from '@react-navigation/stack';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { color, font } from './theme';

// Shared header options for every stack navigator.
export const stackScreenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: color.bg,
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: color.text,
    fontFamily: font.semibold,
    fontSize: 17,
  },
  headerTitleAlign: 'center',
  headerTintColor: color.primaryText,
  headerBackButtonDisplayMode: 'minimal',
  cardStyle: { backgroundColor: color.bg },
};

export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: color.primaryText,
  tabBarInactiveTintColor: color.textTertiary,
  tabBarStyle: {
    backgroundColor: color.bg,
    borderTopColor: color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabelStyle: {
    fontFamily: font.medium,
    fontSize: 11,
  },
};
