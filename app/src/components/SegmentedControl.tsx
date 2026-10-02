import React from 'react';
import {
  Pressable, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';

import Text from './Text';

import { color, radius, space } from '../styles/theme';

interface Option<T extends string> {
  value: T,
  label: string,
}

interface Props<T extends string> {
  options: Array<Option<T>>,
  value: T,
  onChange: (value: T) => void,
  style?: StyleProp<ViewStyle>,
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: radius.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  selected: {
    backgroundColor: color.primary,
  },
});

export default function SegmentedControl<T extends string>({
  options, value, onChange, style,
}: Props<T>) {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => !selected && onChange(option.value)}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Text variant="caption" tone={selected ? 'onPrimary' : 'secondary'} numberOfLines={1} style={{ fontSize: 13 }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
