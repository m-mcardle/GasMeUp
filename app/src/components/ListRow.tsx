import React, { ReactNode } from 'react';
import {
  Pressable, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Text, { TextTone } from './Text';

import { color, space } from '../styles/theme';

interface Props {
  title: string,
  subtitle?: string,
  leading?: ReactNode,
  trailing?: ReactNode,
  value?: string,
  valueTone?: TextTone,
  chevron?: boolean,
  destructive?: boolean,
  separator?: boolean,
  numberOfLines?: number,
  style?: StyleProp<ViewStyle>,
  onPress?: () => void,
  accessibilityLabel?: string,
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  pressed: {
    backgroundColor: color.surfacePressed,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    maxWidth: '55%',
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
  },
});

// One row of a grouped list (friends, settings, gas prices, trips).
export default function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  valueTone = 'secondary',
  chevron = false,
  destructive = false,
  separator = true,
  numberOfLines = 1,
  style,
  onPress,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null, style]}
    >
      {leading}
      <View style={styles.body}>
        <Text variant="callout" tone={destructive ? 'danger' : 'primary'} numberOfLines={numberOfLines}>{title}</Text>
        {!!subtitle && (
          <Text variant="footnote" tone="tertiary" numberOfLines={numberOfLines} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {(value || trailing || chevron) && (
        <View style={styles.trailing}>
          {!!value && <Text variant="callout" tone={valueTone} numberOfLines={1}>{value}</Text>}
          {trailing}
          {chevron && <Ionicons name="chevron-forward" size={18} color={color.textTertiary} />}
        </View>
      )}
      {separator && (
        <View style={[styles.separator, { left: leading ? space.lg + 40 + space.md : space.lg }]} />
      )}
    </Pressable>
  );
}
