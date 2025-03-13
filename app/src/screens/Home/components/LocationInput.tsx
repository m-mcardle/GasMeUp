import React from 'react';
import {
  TextInput, View,
} from 'react-native';
import UseCurrentLocationButton from './UseCurrentLocationButton';
import { colors } from '../../../styles/styles';

import AutocompleteInput from '../../../components/AutocompleteInput';

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

export default function LocationInput({
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
  return (
    <View style={{ zIndex: z }}>
      <AutocompleteInput
        myRef={myRef}
        suggestions={suggestions}
        style={{ backgroundColor: colors.darkestGray }}
        containerStyle={{ width: '75%' }}
        placeholder={placeholder}
        onChangeText={onChangeText}
        onSuggestionPress={onSuggestionPress}
        onPressIn={onPressIn}
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
    </View>
  );
}
