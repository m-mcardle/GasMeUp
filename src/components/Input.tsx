import React from 'react';

import { TextInput } from 'react-native';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  style?: object,
  password?: boolean,
  onChangeText: (arg: string) => void,
  onPressOut?: () => void
}

export default function Input(props: Props) {
  const {
    onChangeText,
    onPressOut,
    placeholder,
    style,
    value,
    password,
  } = props;
  return (
    <TextInput
      value={value}
      style={[globalStyles.input, style]}
      placeholder={placeholder}
      placeholderTextColor={colors.secondary}
      onChangeText={onChangeText}
      onPressOut={onPressOut}
      secureTextEntry={password}
    />
  );
}

Input.defaultProps = {
  value: undefined,
  placeholder: undefined,
  style: undefined,
  onPressOut: undefined,
  password: false,
};
