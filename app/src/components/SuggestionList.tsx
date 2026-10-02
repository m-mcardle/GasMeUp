import React from 'react';
import {
  ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Text from './Text';

import { color, radius, space } from '../styles/theme';

interface Props {
  items: string[],
  loading?: boolean,
  icon?: React.ComponentProps<typeof Ionicons>['name'],
  max?: number,
  style?: StyleProp<ViewStyle>,
  onSelect: (item: string) => void,
}

const styles = StyleSheet.create({
  list: {
    marginTop: space.sm,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.borderStrong,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  pressed: {
    backgroundColor: color.surfacePressed,
  },
  loading: {
    padding: space.lg,
    alignItems: 'center',
  },
});

// Inline autocomplete results shown under an input.
export default function SuggestionList({
  items, loading = false, icon = 'location-outline', max = 6, style, onSelect,
}: Props) {
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <View style={[styles.list, style]}>
      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={color.primaryText} /></View>
      ) : Array.from(new Set(items)).slice(0, max).map((item, index) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          onPress={() => onSelect(item)}
          style={({ pressed }) => [
            styles.item,
            index > 0 ? styles.divider : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name={icon} size={18} color={color.textTertiary} />
          <Text variant="subhead" numberOfLines={1} style={{ flex: 1 }}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}
