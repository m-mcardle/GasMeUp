import React, { ReactNode, useState } from 'react';
import {
  StyleProp, TextInput, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Input from './Input';
import SuggestionList from './SuggestionList';

interface Props {
  value?: string,
  label?: string,
  placeholder?: string,
  viewStyle?: StyleProp<ViewStyle>,
  autoComplete?: TextInput['props']['autoComplete'],
  suggestions: Array<string>,
  keyboardType?: TextInput['props']['keyboardType'],
  returnKeyType?: TextInput['props']['returnKeyType'],
  clearButton?: boolean,
  icon?: ReactNode,
  suggestionIcon?: React.ComponentProps<typeof Ionicons>['name'],
  error?: boolean,
  blurOnSubmit?: boolean,
  showRedundantSuggestion?: boolean,
  editable?: boolean,
  autoFocus?: boolean,
  myRef?: React.RefObject<TextInput | null>,
  suggestionsLoading?: boolean,
  onClear?: () => void,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void,
  onSubmitEditing?: () => void,
  onSuggestionPress?: (str: string) => void,
}

export default function AutocompleteInput({
  onChangeText,
  onPressIn = () => {},
  onSubmitEditing,
  onSuggestionPress = () => {},
  onClear,
  label,
  placeholder,
  viewStyle,
  value,
  clearButton,
  suggestions,
  icon,
  suggestionIcon,
  error,
  returnKeyType,
  myRef = undefined,
  suggestionsLoading = false,
  blurOnSubmit = true,
  keyboardType = 'default',
  autoComplete = 'off',
  showRedundantSuggestion = false,
  editable = true,
  autoFocus = false,
}: Props) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Google can return several predictions with identical text; showing them twice adds nothing.
  const unique = Array.from(new Set(suggestions));
  const redundant = unique.length === 1 && unique[0] === value && !showRedundantSuggestion;

  return (
    <View style={viewStyle}>
      <Input
        myRef={myRef}
        label={label}
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={() => {
          setDropdownVisible(true);
          onPressIn();
        }}
        onBlur={() => setDropdownVisible(false)}
        value={value}
        icon={icon}
        clearButton={clearButton}
        onClear={onClear}
        error={error}
        blurOnSubmit={blurOnSubmit}
        autoComplete={autoComplete}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        keyboardType={keyboardType}
        editable={editable}
        autoFocus={autoFocus}
      />
      {dropdownVisible && !redundant && (
        <SuggestionList
          items={unique}
          loading={suggestionsLoading}
          icon={suggestionIcon}
          max={8}
          onSelect={(item) => {
            onSuggestionPress(item);
            setDropdownVisible(false);
          }}
        />
      )}
    </View>
  );
}
