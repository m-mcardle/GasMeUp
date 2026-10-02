import React, { ReactNode } from 'react';
import {
  ActivityIndicator, Keyboard, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Pressable from './Pressable';
import Text from './Text';

import {
  color, radius, size, space, shadow,
} from '../styles/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  title?: string,
  icon?: React.ComponentProps<typeof Ionicons>['name'],
  variant?: ButtonVariant,
  size?: 'md' | 'sm',
  fullWidth?: boolean,
  loading?: boolean,
  disabled?: boolean,
  style?: StyleProp<ViewStyle>,
  children?: ReactNode,
  accessibilityLabel?: string,
  onPress: () => void,
}

const variants: Record<ButtonVariant, { bg: string, fg: string, border?: string }> = {
  primary: { bg: color.primary, fg: color.textOnPrimary },
  secondary: { bg: color.surfaceRaised, fg: color.text, border: color.borderStrong },
  ghost: { bg: 'transparent', fg: color.primaryText },
  danger: { bg: color.dangerSoft, fg: color.danger },
  success: { bg: color.success, fg: '#062A1B' },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  md: { height: size.control },
  sm: { height: size.controlSm, borderRadius: radius.md, paddingHorizontal: space.md },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
});

export default function Button({
  title,
  icon,
  variant = 'primary',
  size: buttonSize = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  children,
  accessibilityLabel,
  onPress,
}: Props) {
  const { bg, fg, border } = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={[
        styles.base,
        styles[buttonSize],
        { backgroundColor: bg },
        border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: border } : null,
        variant === 'primary' && !inactive ? shadow.glow : null,
        fullWidth ? styles.fullWidth : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={buttonSize === 'sm' ? 16 : 18} color={fg} />}
          {title ? (
            <Text variant={buttonSize === 'sm' ? 'caption' : 'headline'} style={{ color: fg }} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {children ? <View>{children}</View> : null}
        </>
      )}
    </Pressable>
  );
}
