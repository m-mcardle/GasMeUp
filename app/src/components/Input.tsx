import React, { ReactNode, useState } from 'react';
import {
  Keyboard, StyleProp, StyleSheet, TextInput, TextStyle, View, ViewStyle, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Text from './Text';

import {
  color, radius, size, space, type,
} from '../styles/theme';

interface Props {
  value?: string,
  label?: string,
  placeholder?: string,
  helperText?: string,
  viewStyle?: StyleProp<ViewStyle>,
  containerStyle?: StyleProp<ViewStyle>,
  style?: StyleProp<TextStyle>,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  autoCapitalize?: TextInput['props']['autoCapitalize'],
  textContentType?: TextInput['props']['textContentType'],
  keyboardType?: TextInput['props']['keyboardType'],
  returnKeyType?: TextInput['props']['returnKeyType'],
  clearButton?: boolean,
  icon?: ReactNode,
  trailing?: ReactNode,
  error?: boolean,
  blurOnSubmit?: boolean,
  myRef?: React.RefObject<TextInput | null>,
  editable?: boolean,
  autoFocus?: boolean,
  onClear?: () => void,
  onBlur?: () => void,
  onFocus?: () => void,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void,
  onSubmitEditing?: () => void,
}

const styles = StyleSheet.create({
  label: {
    marginBottom: space.sm,
    marginLeft: space.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.control,
    borderRadius: radius.md,
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  focused: {
    borderColor: color.primary,
    backgroundColor: color.surfacePressed,
  },
  error: {
    borderColor: color.danger,
  },
  // Locked fields (e.g. a confirmed selection) keep full contrast; only the border changes.
  locked: {
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  input: {
    ...type.body,
    flex: 1,
    color: color.text,
    paddingVertical: space.md,
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: color.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    marginTop: space.xs,
    marginLeft: space.xs,
  },
});

export default function Input({
  onChangeText,
  onPressIn,
  onSubmitEditing,
  onClear,
  onBlur,
  onFocus,
  label,
  placeholder,
  helperText,
  viewStyle,
  containerStyle,
  style,
  value,
  password,
  clearButton,
  icon,
  trailing,
  error,
  returnKeyType,
  autoCapitalize,
  textContentType,
  myRef = undefined,
  blurOnSubmit = true,
  keyboardType = 'default',
  autoComplete = 'off',
  editable = true,
  autoFocus = false,
}: Props) {
  const [focused, setFocused] = useState(false);

  const clearInput = () => {
    if (value === '') {
      Keyboard.dismiss();
    }

    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  const isEmailField = keyboardType === 'email-address';

  return (
    <View style={viewStyle}>
      {label && (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          focused ? styles.focused : null,
          error ? styles.error : null,
          !editable ? styles.locked : null,
          containerStyle,
        ]}
      >
        {icon}
        <TextInput
          ref={myRef}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={color.textTertiary}
          selectionColor={color.primary}
          blurOnSubmit={blurOnSubmit}
          style={[styles.input, style]}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize ?? (isEmailField || password ? 'none' : 'sentences')}
          autoCorrect={!isEmailField && !password}
          textContentType={textContentType}
          onChangeText={onChangeText}
          onPressIn={onPressIn}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          secureTextEntry={password}
          autoComplete={autoComplete}
          editable={editable}
          autoFocus={autoFocus && editable}
          keyboardAppearance="dark"
          accessibilityLabel={label ?? placeholder}
        />
        {clearButton && !!value && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label ?? placeholder ?? 'field'}`}
            hitSlop={size.hitSlop}
            style={styles.clear}
            onPress={clearInput}
          >
            <Ionicons name="close" size={14} color={color.textSecondary} />
          </Pressable>
        )}
        {trailing}
      </View>
      {!!helperText && (
        <Text variant="caption" tone={error ? 'danger' : 'tertiary'} style={styles.helper}>
          {helperText}
        </Text>
      )}
    </View>
  );
}
