import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement } from 'react';

import {
  TextInput, TouchableOpacity, View,
} from 'react-native';

import Autocomplete from 'react-native-autocomplete-input';

import Text from './Text';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  z?: number,
  value?: string,
  placeholder?: string,
  containerStyle?: object,
  style?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  suggestions?: Array<string>,
  keyboardType?: TextInput['props']['keyboardType'],
  returnKeyType?: TextInput['props']['returnKeyType'],
  clearButton?: boolean,
  icon?: ReactComponentElement<typeof MaterialIcons>,
  error?: boolean,
  blurOnSubmit?: boolean,
  myRef?: React.RefObject<TextInput>,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void,
  onSubmitEditing?: () => void,
  onSuggestionPress?: (str: string) => void,
}

export default function Input(props: Props) {
  const {
    onChangeText,
    onPressIn,
    onSubmitEditing,
    onSuggestionPress,
    placeholder,
    containerStyle,
    style,
    value,
    password,
    clearButton,
    suggestions,
    icon,
    error,
    returnKeyType,
    z,
    myRef = undefined,
    blurOnSubmit = true,
    keyboardType = 'default',
    autoComplete = 'off',
  } = props;

  // Logic to resize the input based on the presence of an icon and clear button
  let numWidth = clearButton ? 90 : 100;
  if (icon) {
    numWidth -= 10;
  }
  const width = `${numWidth}%`;
  return (
    suggestions
      ? (
        <View style={[globalStyles.inputView, { zIndex: z }]}>
          {!!icon && (
            <View style={globalStyles.inputItem}>
              {icon}
            </View>
          )}
          <View style={[globalStyles.autocompleteContainer, { zIndex: z }]}>
            <Autocomplete
              // renderTextInput={(props) => ()}
              style={[style, { color: 'white', width: '100%', zIndex: z }]}
              data={(suggestions.length === 1 && suggestions[0] === value
                ? []
                : suggestions.map((s) => ({ title: s, id: s }))
              )}
              value={value}
              onChangeText={onChangeText}
              onPressIn={onPressIn}
              onSubmitEditing={onSubmitEditing}
              keyboardType={keyboardType}
              returnKeyType={returnKeyType}
              placeholder={placeholder}
              placeholderTextColor={colors.secondary}
              inputContainerStyle={[
                globalStyles.suggestionInput,
                error ? { ...globalStyles.errorInput } : undefined,
                style,
                { zIndex: z },
              ]}
              listContainerStyle={{
                backgroundColor: colors.tertiary, maxHeight: 128, width: '100%', zIndex: z,
              }}
              containerStyle={{ width: '100%', zIndex: z }}
              flatListProps={{
                keyboardShouldPersistTaps: 'always',
                keyExtractor: ({ title }: any) => title,
                renderItem: ({ item: { title } } : any) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (onSuggestionPress) onSuggestionPress(title);
                    }}
                    style={{ padding: 4, zIndex: z }}
                  >
                    <Text>{title}</Text>
                  </TouchableOpacity>
                ),
              }}
            />
          </View>
          {clearButton && (
            <View style={globalStyles.inputItem}>
              <TouchableOpacity style={[{ backgroundColor: 'white' }, globalStyles.clearInputButton]} onPress={() => onChangeText('')}>
                <MaterialIcons name="clear" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )
      : (
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
            placeholder={placeholder}
            placeholderTextColor={colors.secondary}
            onChangeText={onChangeText}
            onPressIn={onPressIn}
            onSubmitEditing={onSubmitEditing}
            secureTextEntry={password}
            autoComplete={autoComplete}
          />
          {clearButton && (
            <TouchableOpacity style={globalStyles.clearInputButton} onPress={() => onChangeText('')}>
              <MaterialIcons name="clear" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )
  );
}

Input.defaultProps = {
  z: undefined,
  value: undefined,
  placeholder: undefined,
  style: undefined,
  containerStyle: undefined,
  onPressIn: undefined,
  password: false,
  autoComplete: 'off',
  clearButton: false,
  icon: undefined,
  suggestions: undefined,
  error: false,
  returnKeyType: undefined,
  blurOnSubmit: true,
  keyboardType: 'default',
  myRef: undefined,
  onSubmitEditing: undefined,
  onSuggestionPress: undefined,
};
