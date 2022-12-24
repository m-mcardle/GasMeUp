import React from 'react';

import {
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  style?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  clearButton?: boolean,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void
}

export default function Input(props: Props) {
  const {
    onChangeText,
    onPressIn,
    placeholder,
    style,
    value,
    password,
    clearButton,
    autoComplete = 'off',
  } = props;
  return (
    <View style={globalStyles.inputView}>
      <TextInput
        value={value}
        style={[globalStyles.input, (clearButton ? { width: '90%' } : { width: '100%' }), style]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        onChangeText={onChangeText}
        onPressIn={onPressIn}
        secureTextEntry={password}
        autoComplete={autoComplete}
      />
      {clearButton && (
        <TouchableOpacity style={globalStyles.clearInputButton} onPress={() => onChangeText('')}>
          <Text style={{ color: colors.primary }}>X</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

Input.defaultProps = {
  value: undefined,
  placeholder: undefined,
  style: undefined,
  onPressIn: undefined,
  password: false,
  autoComplete: 'off',
  clearButton: false,
};
