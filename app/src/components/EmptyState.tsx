import React, { ReactNode } from 'react';
import {
  StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Text from './Text';

import { color, radius, space } from '../styles/theme';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'],
  title: string,
  message?: string,
  tone?: 'brand' | 'danger',
  action?: ReactNode,
  style?: StyleProp<ViewStyle>,
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  message: {
    marginTop: space.xs,
    maxWidth: 280,
  },
  action: {
    marginTop: space.xl,
  },
});

export default function EmptyState({
  icon, title, message, tone = 'brand', action, style,
}: Props) {
  const isDanger = tone === 'danger';
  const iconBackground = isDanger ? color.dangerSoft : color.primarySoft;
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={28} color={isDanger ? color.danger : color.primaryText} />
      </View>
      <Text variant="title3" align="center">{title}</Text>
      {!!message && <Text variant="subhead" tone="secondary" align="center" style={styles.message}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}
