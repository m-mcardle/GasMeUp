import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement } from 'react';

import {
  TextInput, TouchableOpacity, View,
} from 'react-native';

import Text from './Text';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  viewStyle?: object,
  labelStyle?: object,
  containerStyle?: object,
  style?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  keyboardType?: TextInput['props']['keyboardType'],
  returnKeyType?: TextInput['props']['returnKeyType'],
  clearButton?: boolean,
  icon?: ReactComponentElement<typeof MaterialIcons>,
  error?: boolean,
  blurOnSubmit?: boolean,
  myRef?: React.RefObject<TextInput>,
  editable?: boolean,
  onClear?: () => void,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void,
  onSubmitEditing?: () => void,
}

export default function Input(props: Props) {
  const {
    onChangeText,
    onPressIn,
    onSubmitEditing,
    onClear,
    placeholder,
    labelStyle,
    viewStyle,
    containerStyle,
    style,
    value,
    password,
    clearButton,
    icon,
    error,
    returnKeyType,
    myRef = undefined,
    blurOnSubmit = true,
    keyboardType = 'default',
    autoComplete = 'off',
    editable = true,
  } = props;

  const clearInput = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  // Logic to resize the input based on the presence of an icon and clear button
  let numWidth = clearButton ? 90 : 100;
  if (icon) {
    numWidth -= 10;
  }
  const width = `${numWidth}%`;
  return (
    <View style={viewStyle}>
      {placeholder && (
      <Text style={{ margin: 4, paddingLeft: (icon ? 42 : 0), ...labelStyle }}>
        {placeholder}
      </Text>
      )}
      <View style={[globalStyles.inputView, containerStyle]}>
        {icon}
        <TextInput
          ref={myRef}
          value={value}
          blurOnSubmit={blurOnSubmit}
          style={[
            globalStyles.input,
            { width },
            error ? { ...globalStyles.errorInput } : undefined,
            style,
          ]}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onChangeText={onChangeText}
          onPressIn={onPressIn}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={password}
          autoComplete={autoComplete}
          editable={editable}
          keyboardAppearance="dark"
        />
        {clearButton && (
          <TouchableOpacity
            style={globalStyles.clearInputButton}
            onPress={clearInput}
          >
            <MaterialIcons name="clear" size={15} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

Input.defaultProps = {
  value: undefined,
  placeholder: undefined,
  style: undefined,
  viewStyle: undefined,
  labelStyle: undefined,
  containerStyle: undefined,
  onPressIn: undefined,
  password: false,
  autoComplete: 'off',
  clearButton: false,
  icon: undefined,
  error: false,
  returnKeyType: undefined,
  blurOnSubmit: true,
  keyboardType: 'default',
  myRef: undefined,
  onSubmitEditing: undefined,
  editable: true,
  onClear: undefined,
};
