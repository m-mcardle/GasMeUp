import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Text from './Text';

import { space } from '../styles/theme';

interface Props {
  title: string,
  subtitle?: string,
  eyebrow?: string,
  actions?: ReactNode,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.md,
  },
  titles: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingBottom: 2,
  },
});

// Large left-aligned title used at the top of each tab.
export default function ScreenHeader({
  title, subtitle, eyebrow, actions,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titles}>
        {!!eyebrow && <Text variant="overline" tone="brand" style={{ marginBottom: space.xs }}>{eyebrow}</Text>}
        <Text variant="title1" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        {!!subtitle && <Text variant="subhead" tone="secondary" style={{ marginTop: space.xs }}>{subtitle}</Text>}
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}
