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
  listContainerStyle?: object,
  containerStyle?: object,
  style?: object,
  labelStyle?: object,
  password?: boolean,
  autoComplete?: TextInput['props']['autoComplete'],
  suggestions: Array<string>,
  keyboardType?: TextInput['props']['keyboardType'],
  returnKeyType?: TextInput['props']['returnKeyType'],
  clearButton?: boolean,
  icon?: ReactComponentElement<typeof MaterialIcons>,
  error?: boolean,
  blurOnSubmit?: boolean,
  showRedundantSuggestion?: boolean,
  editable?: boolean,
  myRef?: React.RefObject<TextInput>,
  onClear?: () => void,
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
    onClear,
    placeholder,
    listContainerStyle,
    labelStyle,
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
    showRedundantSuggestion = false,
    editable = true,
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
              labelStyle={labelStyle}
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
              editable={editable}
              onClear={onClear}
            />
          )}
          data={(suggestions.length === 1 && suggestions[0] === value && !showRedundantSuggestion
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
          listContainerStyle={[globalStyles.autocompleteListContainer, listContainerStyle]}
          containerStyle={[globalStyles.autocompleteNestedContainer, { zIndex: z }]}
          flatListProps={{
            keyboardShouldPersistTaps: 'always',
            keyExtractor: ({ title }: any) => title,
            renderItem: ({ item: { title } } : any) => (
              <TouchableOpacity
                onPress={() => {
                  if (onSuggestionPress) onSuggestionPress(title);
                }}
                style={[globalStyles.autocompleteListItem, (icon ? { paddingLeft: 52 } : {})]}
              >
                <Text style={{ fontSize: 12 }} numberOfLines={1}>{title}</Text>
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
  listContainerStyle: undefined,
  style: undefined,
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
  onSuggestionPress: undefined,
  editable: true,
  showRedundantSuggestion: false,
  onClear: undefined,
};
