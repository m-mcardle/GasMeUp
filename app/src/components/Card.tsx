import React, { ReactNode } from 'react';
import {
  StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';

import Pressable from './Pressable';

import { color, radius, space } from '../styles/theme';

interface Props {
  children: ReactNode,
  padded?: boolean,
  style?: StyleProp<ViewStyle>,
  onPress?: () => void,
  accessibilityLabel?: string,
}

export const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    overflow: 'hidden',
  },
  padded: {
    padding: space.lg,
  },
});

export default function Card({
  children, padded = true, style, onPress, accessibilityLabel,
}: Props) {
  const cardStyles = [cardStyle.card, padded ? cardStyle.padded : null, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={cardStyles}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyles}>{children}</View>;
}
