import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement } from 'react';

import {
  TextInput, TouchableOpacity, View,
} from 'react-native';

import Autocomplete from 'react-native-autocomplete-input';

import Text from './Text';
import Input from './Input';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  z?: number,
  value?: string,
  placeholder?: string,
  containerStyle?: object,
  style?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  suggestions: Array<string>,
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

export default function AutocompleteInput(props: Props) {
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

  return (
    <View style={[globalStyles.autocompleteInputView, { zIndex: z }]}>
      <View style={[globalStyles.autocompleteContainer, { zIndex: z }]}>
        <Autocomplete
          renderTextInput={() => (
            <Input
              onChangeText={onChangeText}
              onPressIn={onPressIn}
              onSubmitEditing={onSubmitEditing}
              placeholder={placeholder}
              style={[style, { borderWidth: 0 }]}
              containerStyle={{ ...containerStyle, width: '100%', paddingHorizontal: 8 }}
              value={value}
              password={password}
              clearButton={clearButton}
              icon={icon}
              error={error}
              returnKeyType={returnKeyType}
              myRef={myRef}
              blurOnSubmit={blurOnSubmit}
              keyboardType={keyboardType}
              autoComplete={autoComplete}
            />
          )}
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
            { backgroundColor: colors.tertiary },
            error ? { borderColor: colors.red } : { borderWidth: 0 },
          ]}
          listContainerStyle={globalStyles.autocompleteListContainer}
          containerStyle={[globalStyles.autocompleteNestedContainer, { zIndex: z }]}
          flatListProps={{
            keyboardShouldPersistTaps: 'always',
            keyExtractor: ({ title }: any) => title,
            renderItem: ({ item: { title } } : any) => (
              <TouchableOpacity
                onPress={() => {
                  if (onSuggestionPress) onSuggestionPress(title);
                }}
                style={{ padding: 4, zIndex: z, paddingLeft: 52 }}
              >
                <Text style={{ fontSize: 12 }}>{title}</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </View>
    </View>
  );
}

AutocompleteInput.defaultProps = {
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
  error: false,
  returnKeyType: undefined,
  blurOnSubmit: true,
  keyboardType: 'default',
  myRef: undefined,
  onSubmitEditing: undefined,
  onSuggestionPress: undefined,
};
