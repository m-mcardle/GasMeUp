import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement, useState } from 'react';

import {
  TextInput, TouchableOpacity, View, ScrollView,
} from 'react-native';

import Text from './Text';
import Input from './Input';
import AnimatedGradient from './AnimatedGradient';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  z?: number,
  value?: string,
  placeholder?: string,
  viewStyle?: object,
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
  suggestionsLoading?: boolean,
  onClear?: () => void,
  onChangeText: (arg: string) => void,
  onPressIn?: () => void,
  onSubmitEditing?: () => void,
  onSuggestionPress?: (str: string) => void,
}

export default function AutocompleteInput(props: Props) {
  const {
    onChangeText,
    onPressIn = () => {},
    onSubmitEditing,
    onSuggestionPress = () => {},
    onClear,
    placeholder,
    viewStyle,
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
    suggestionsLoading = false,
    blurOnSubmit = true,
    keyboardType = 'default',
    autoComplete = 'off',
    showRedundantSuggestion = false,
    editable = true,
  } = props;

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleFocus = () => {
    setDropdownVisible(true);
    onPressIn();
  };

  const handleBlur = () => {
    setDropdownVisible(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    onSuggestionPress(suggestion);
    setDropdownVisible(false);
  };

  const loadingGradientColors = [
    colors.tertiary,
    colors.darkestGray,
    colors.tertiary,
    colors.tertiary,
    colors.darkestGray,
    colors.tertiary,
  ];

  const overriddenSuggestions = suggestionsLoading ? ['Loading...'] : suggestions;

  const internalSuggestions = ((
    overriddenSuggestions.length === 1
    && overriddenSuggestions[0] === value
    && !showRedundantSuggestion
  )
    ? []
    : overriddenSuggestions.map((s) => ({ title: s, id: s }))
  );

  return (
    <View style={[globalStyles.autocompleteInputView, { zIndex: z }]}>
      <View style={[globalStyles.autocompleteContainer, { zIndex: z }]}>
        <Input
          myRef={myRef}
          style={{ backgroundColor: colors.darkestGray, ...style }}
          viewStyle={[globalStyles.autocompleteInput, viewStyle]}
          labelStyle={labelStyle}
          containerStyle={containerStyle}
          placeholder={placeholder}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
          password={password}
        />
        {dropdownVisible && internalSuggestions.length > 0 && (
          <ScrollView
            style={globalStyles.dropdown}
            keyboardShouldPersistTaps="always"
          >
            {overriddenSuggestions.map((suggestion) => (suggestionsLoading
              ? (
                <AnimatedGradient
                  animate={suggestionsLoading}
                  colors={loadingGradientColors}
                  speed={1000}
                  style={globalStyles.autocompleteListItem}
                >
                  <Text style={{ padding: 8 }}>
                    Loading...
                  </Text>
                </AnimatedGradient>
              )
              : (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => handleSuggestionPress(suggestion)}
                  style={globalStyles.suggestion}
                >
                  <Text style={{ color: colors.gray }}>{suggestion}</Text>
                </TouchableOpacity>
              )))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
