import React, { useState } from 'react';
import {
  TextInput, View, TouchableOpacity,
} from 'react-native';
import Input from '../../../components/Input';
import Text from '../../../components/Text';
import UseCurrentLocationButton from './UseCurrentLocationButton';
import { colors, globalStyles } from '../../../styles/styles';

import styles from '../../../styles/HomeScreen.styles';

interface Props {
  z: number;
  returnKeyType: TextInput['props']['returnKeyType'];
  suggestions: string[];
  myRef?: React.RefObject<TextInput>;
  error?: boolean;
  value: string;
  placeholder: string;
  useCurrentLocationActive: boolean;
  useCurrentLocationDisabled: boolean;
  blurOnSubmit?: boolean;
  onUseCurrentLocationPress: () => void;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  onSuggestionPress: (suggestion: string) => void;
  onPressIn: () => void;
  onClear: () => void;
}

export default function LocationInputOld({
  z,
  returnKeyType,
  suggestions,
  myRef,
  error,
  value,
  placeholder,
  useCurrentLocationActive,
  useCurrentLocationDisabled,
  blurOnSubmit = true,
  onUseCurrentLocationPress,
  onChangeText,
  onSubmitEditing,
  onSuggestionPress,
  onPressIn,
  onClear,
}: Props) {
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

  return (
    <View style={{ zIndex: z }}>
      <Input
        myRef={myRef}
        style={{ backgroundColor: colors.darkestGray }}
        viewStyle={globalStyles.autocompleteInput}
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        icon={(
          <UseCurrentLocationButton
            color={(useCurrentLocationActive ? colors.action : colors.secondary)}
            disabled={useCurrentLocationDisabled}
            onPress={onUseCurrentLocationPress}
          />
        )}
        clearButton
        onClear={onClear}
        error={error}
        blurOnSubmit={blurOnSubmit}
        autoComplete="street-address"
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {dropdownVisible && suggestions.length > 0 && (
        <View style={globalStyles.dropdown}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
              style={styles.suggestion}
            >
              <Text>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
