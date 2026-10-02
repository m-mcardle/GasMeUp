import React from 'react';
import {
  StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Pressable from './Pressable';
import Text from './Text';

import {
  color, radius, size, space,
} from '../styles/theme';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'],
  accessibilityLabel: string,
  variant?: 'surface' | 'plain' | 'primary' | 'danger' | 'success',
  size?: number,
  badge?: number,
  disabled?: boolean,
  style?: StyleProp<ViewStyle>,
  onPress: () => void,
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.bg,
  },
});

const variants = {
  surface: { bg: color.surfaceRaised, fg: color.text },
  plain: { bg: 'transparent', fg: color.text },
  primary: { bg: color.primarySoft, fg: color.primaryText },
  danger: { bg: color.dangerSoft, fg: color.danger },
  success: { bg: color.successSoft, fg: color.success },
};

export default function IconButton({
  icon,
  accessibilityLabel,
  variant = 'surface',
  size: buttonSize = size.iconButton,
  badge,
  disabled,
  style,
  onPress,
}: Props) {
  const { bg, fg } = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={size.hitSlop}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          width: buttonSize, height: buttonSize, backgroundColor: bg, opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(buttonSize * 0.48)} color={fg} />
      {!!badge && (
        <View style={styles.badge}>
          <Text variant="caption" tone="onPrimary" style={{ fontSize: 10, lineHeight: 12 }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
