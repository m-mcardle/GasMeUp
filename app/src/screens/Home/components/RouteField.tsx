import React, { useState } from 'react';
import {
  Pressable, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../../components/Input';
import SuggestionList from '../../../components/SuggestionList';

import {
  color, radius, size, space,
} from '../../../styles/theme';

interface Props {
  kind: 'start' | 'end',
  returnKeyType: TextInput['props']['returnKeyType'];
  suggestions: string[];
  myRef?: React.RefObject<TextInput | null>;
  error?: boolean;
  value: string;
  placeholder: string;
  useCurrentLocationActive: boolean;
  useCurrentLocationDisabled: boolean;
  blurOnSubmit?: boolean;
  onUseCurrentLocationPress: () => void;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  onSuggestionPress: (suggestion: string) => void;
  onPressIn: () => void;
  onClear: () => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  markerColumn: {
    width: 14,
    alignItems: 'center',
  },
  startMarker: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: color.primaryText,
  },
  endMarker: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: color.success,
  },
  field: {
    flex: 1,
  },
  locate: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space.xs,
  },
  suggestions: {
    marginLeft: 14 + space.md,
  },
});

// One endpoint (start or destination) of the route card on the Calculate screen.
export default function RouteField({
  kind,
  returnKeyType,
  suggestions,
  myRef,
  error,
  value,
  placeholder,
  useCurrentLocationActive,
  useCurrentLocationDisabled,
  blurOnSubmit = true,
  onUseCurrentLocationPress,
  onChangeText,
  onSubmitEditing,
  onSuggestionPress,
  onPressIn,
  onClear,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.markerColumn}>
          <View style={kind === 'start' ? styles.startMarker : styles.endMarker} />
        </View>
        <Input
          myRef={myRef}
          viewStyle={styles.field}
          placeholder={placeholder}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
            onPressIn();
          }}
          onBlur={() => setFocused(false)}
          value={value}
          clearButton
          onClear={onClear}
          error={error}
          blurOnSubmit={blurOnSubmit}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={useCurrentLocationActive ? { color: color.primaryText } : undefined}
          trailing={(
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Use current location as ${kind === 'start' ? 'start' : 'destination'}`}
              accessibilityState={{
                selected: useCurrentLocationActive,
                disabled: useCurrentLocationDisabled,
              }}
              disabled={useCurrentLocationDisabled}
              hitSlop={size.hitSlop}
              onPress={onUseCurrentLocationPress}
              style={[
                styles.locate,
                { backgroundColor: useCurrentLocationActive ? color.primarySoft : 'transparent' },
                useCurrentLocationDisabled ? { opacity: 0.35 } : null,
              ]}
            >
              <Ionicons
                name={useCurrentLocationActive ? 'navigate' : 'navigate-outline'}
                size={18}
                color={useCurrentLocationActive ? color.primaryText : color.textSecondary}
              />
            </Pressable>
          )}
        />
      </View>
      {focused && (
        <SuggestionList
          items={suggestions}
          style={styles.suggestions}
          onSelect={(item) => {
            onSuggestionPress(item);
            setFocused(false);
          }}
        />
      )}
    </View>
  );
}
