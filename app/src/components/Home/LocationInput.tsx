// React imports
import React, {
  RefObject,
} from 'react';
import {
  TextInput,
} from 'react-native';

// Components
import AutocompleteInput from '../AutocompleteInput';

import UseCurrentLocationButton from './UseCurrentLocationButton';

// Styles
import { colors } from '../../styles/styles';

interface Props {
  z: number,
  myRef?: RefObject<TextInput>,
  returnKeyType: 'done' | 'next',
  error: boolean,
  value: string,
  suggestions: Array<string>,
  placeholder: string,
  blurOnSubmit?: boolean,
  useCurrentLocationActive: boolean,
  useCurrentLocationDisabled: boolean,
  onChangeText: (text: string) => void,
  onSubmitEditing: () => void,
  onSuggestionPress: (suggestion: string) => void,
  onPressIn: () => void,
  onClear: () => void,
  onUseCurrentLocationPress: () => void,
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
    <AutocompleteInput
      myRef={myRef}
      z={z}
      style={{ backgroundColor: colors.darkestGray }}
      suggestions={suggestions}
      onSuggestionPress={onSuggestionPress}
      placeholder={placeholder}
      onChangeText={onChangeText}
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
  );
}

LocationInput.defaultProps = {
  myRef: undefined,
  blurOnSubmit: true,
};
