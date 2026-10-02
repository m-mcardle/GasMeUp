import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Text from './Text';

import { space } from '../styles/theme';

interface Props {
  title: string,
  action?: ReactNode,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xxl,
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
  },
});

export default function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="overline" tone="tertiary">{title}</Text>
      {action}
    </View>
  );
}
