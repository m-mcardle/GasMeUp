import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement } from 'react';

import {
  TextInput, TouchableOpacity, View,
} from 'react-native';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  style?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  clearButton?: boolean,
  icon?: ReactComponentElement<typeof MaterialIcons>,
  error?: boolean,
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
    icon,
    error,
    autoComplete = 'off',
  } = props;

  // Logic to resize the input based on the presence of an icon and clear button
  let numWidth = clearButton ? 90 : 100;
  if (icon) {
    numWidth -= 10;
  }
  const width = `${numWidth}%`;

  return (
    <View style={globalStyles.inputView}>
      {icon}
      <TextInput
        value={value}
        style={[
          globalStyles.input,
          { width },
          error ? { ...globalStyles.errorInput } : undefined,
          style,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.black}
        onChangeText={onChangeText}
        onPressIn={onPressIn}
        secureTextEntry={password}
        autoComplete={autoComplete}
      />
      {clearButton && (
        <TouchableOpacity style={globalStyles.clearInputButton} onPress={() => onChangeText('')}>
          <MaterialIcons name="clear" size={15} color={colors.primary} />
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
  icon: undefined,
  error: false,
};
