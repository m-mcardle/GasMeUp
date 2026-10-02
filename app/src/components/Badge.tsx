import React from 'react';
import { StyleSheet, View } from 'react-native';

import Text from './Text';

import { color, radius, space } from '../styles/theme';

type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'neutral';

const tones: Record<Tone, { bg: string, fg: string }> = {
  brand: { bg: color.primarySoft, fg: color.primaryText },
  success: { bg: color.successSoft, fg: color.success },
  danger: { bg: color.dangerSoft, fg: color.danger },
  warning: { bg: color.warningSoft, fg: color.warning },
  neutral: { bg: color.surfacePressed, fg: color.textSecondary },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});

export default function Badge({ label, tone = 'brand' }: { label: string, tone?: Tone }) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ color: fg, fontSize: 11, lineHeight: 14 }}>{label}</Text>
    </View>
  );
}
