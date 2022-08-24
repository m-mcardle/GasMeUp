import React from 'react';

import { TextInput } from 'react-native';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  style?: object,
  password?: boolean,
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
  } = props;
  return (
    <TextInput
      value={value}
      style={[globalStyles.input, style]}
      placeholder={placeholder}
      placeholderTextColor={colors.secondary}
      onChangeText={onChangeText}
      onPressIn={onPressIn}
      secureTextEntry={password}
    />
  );
}

Input.defaultProps = {
  value: undefined,
  placeholder: undefined,
  style: undefined,
  onPressIn: undefined,
  password: false,
};
