import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import React, { ReactComponentElement } from 'react';

import {
  TextInput, TouchableOpacity, View,
} from 'react-native';

import Autocomplete from 'react-native-autocomplete-input';

import Text from './Text';
import Input from './Input';
import AnimatedGradient from './AnimatedGradient';

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
    suggestionsLoading = false,
    blurOnSubmit = true,
    keyboardType = 'default',
    autoComplete = 'off',
    showRedundantSuggestion = false,
    editable = true,
  } = props;

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

  // this is a hack but it doesn't really work
  // const renderTextInput = useCallback(() => (
  //   <Input
  //   onChangeText={onChangeText}
  //   onPressIn={onPressIn}
  //   onSubmitEditing={onSubmitEditing}
  //   placeholder={placeholder}
  //   style={[style, { borderWidth: 0 }]}
  //   labelStyle={labelStyle}
  //   containerStyle={{ ...containerStyle, width: '100%', paddingHorizontal: 8 }}
  //   value={value}
  //   password={password}
  //   clearButton={clearButton}
  //   icon={icon}
  //   error={error}
  //   returnKeyType={returnKeyType}
  //   myRef={myRef}
  //   blurOnSubmit={blurOnSubmit}
  //   keyboardType={keyboardType}
  //   autoComplete={autoComplete}
  //   editable={editable}
  //   onClear={onClear}
  // />
  // ), []);

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
          data={internalSuggestions}
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
            style: { backgroundColor: colors.tertiary },
            keyboardShouldPersistTaps: 'always',
            keyExtractor: ({ title }: any) => title,
            renderItem: ({ item: { title } } : any) => (
              suggestionsLoading
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
                    onPress={() => {
                      if (onSuggestionPress) onSuggestionPress(title);
                    }}
                    style={[globalStyles.autocompleteListItem, (icon ? { paddingLeft: 52 } : {})]}
                  >
                    <Text style={{ fontSize: 12 }} numberOfLines={1}>{title}</Text>
                  </TouchableOpacity>
                )),
          }}
        />
      </View>
    </View>
  );
}
