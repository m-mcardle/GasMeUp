import React, { useRef, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local replacement for the unmaintained `react-native-numeric-input` GitHub fork
// (its function-component `defaultProps` are ignored by React 19). It reproduces the
// "plus-minus" variant with validate-on-blur, which is the only mode the app used.

interface Props {
  value: number,
  onChange: (value: number) => void,
  step?: number,
  minValue?: number,
  maxValue?: number,
  valueType?: 'real' | 'integer',
  totalWidth?: number,
  totalHeight?: number,
  rounded?: boolean,
  textColor?: string,
  borderColor?: string,
  separatorWidth?: number,
  leftButtonBackgroundColor?: string,
  rightButtonBackgroundColor?: string,
  containerStyle?: StyleProp<ViewStyle>,
  inputStyle?: StyleProp<TextStyle>,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  // Plain row layout (the original library used absolutely positioned buttons with
  // zIndex -1, which the New Architecture draws beneath the container background).
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  inputWrapper: {
    alignSelf: 'center',
  },
  input: {
    textAlign: 'center',
    padding: 0,
  },
  icon: {
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0)',
  },
});

const LEGAL_NUMBER = /^-?[0-9]\d*(\.\d+)?$/;

export default function NumericInput({
  value,
  onChange,
  step = 1,
  minValue,
  maxValue,
  valueType = 'integer',
  totalWidth = 150,
  totalHeight,
  rounded = false,
  textColor = 'black',
  borderColor = '#d4d4d4',
  separatorWidth = 1,
  leftButtonBackgroundColor = 'white',
  rightButtonBackgroundColor = 'white',
  containerStyle,
  inputStyle,
}: Props) {
  const [current, setCurrent] = useState<number>(value ?? 0);
  const [text, setText] = useState<string>(String(value ?? 0));
  const lastValid = useRef<number>(value ?? 0);

  const parse = (raw: string) => {
    const parsed = valueType === 'real' ? parseFloat(raw) : parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const round = (raw: number) => parse(raw.toFixed(12));
  const inRange = (candidate: number) => (maxValue === undefined || candidate <= maxValue)
    && (minValue === undefined || candidate >= minValue);

  const commit = (next: number) => {
    setCurrent(next);
    setText(next.toString());
    if (next !== value) {
      onChange(next);
    }
  };

  // The parent-controlled value wins when it is a non-zero number (library behaviour).
  const base = () => (value && typeof value === 'number' ? value : current);

  const increment = () => {
    const start = base();
    commit(maxValue === undefined || start + step < maxValue ? round(start + step) : maxValue);
  };

  const decrement = () => {
    const start = base();
    commit(minValue === undefined || start - step > minValue ? round(start - step) : minValue);
  };

  const onChangeText = (raw: string) => {
    const input = raw.replace(',', '.');
    if (input === '-' || input === '0-') {
      setText('-');
      return;
    }
    if (input === '.' || input === '0.') {
      setText('0.');
      return;
    }
    if (input.endsWith('.')) {
      setText(input);
      return;
    }
    const parsed = parse(input);
    if (parsed !== value) {
      onChange(parsed);
    }
    setCurrent(parsed);
    setText(parsed.toString());
  };

  const onBlur = () => {
    const legal = LEGAL_NUMBER.test(text) && inRange(parseFloat(text));
    if (!legal) {
      // Revert to the last valid value, as the original component did.
      commit(lastValid.current);
    }
  };

  const onFocus = () => {
    lastValid.current = current;
  };

  const height = totalHeight ?? totalWidth * 0.4;
  const inputWidth = totalWidth * 0.4;
  // Fit both buttons inside the 1px container border and the separators around the input.
  const buttonWidth = (totalWidth - 2 - inputWidth - separatorWidth * 4) / 2;
  const radius = height * 0.18;
  const fontSize = height * 0.38;

  return (
    <View
      style={[
        styles.container,
        { width: totalWidth, height, borderColor },
        rounded ? { borderRadius: radius } : null,
        containerStyle,
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={() => requestAnimationFrame(decrement)}
        style={[
          styles.button,
          {
            height: height - 2,
            width: buttonWidth,
            backgroundColor: leftButtonBackgroundColor,
          },
          rounded ? { borderTopLeftRadius: radius, borderBottomLeftRadius: radius } : null,
        ]}
      >
        <Ionicons name="remove" size={fontSize} style={styles.icon} />
      </TouchableOpacity>
      <View
        style={[
          styles.inputWrapper,
          {
            borderLeftColor: borderColor,
            borderRightColor: borderColor,
            borderLeftWidth: separatorWidth,
            borderRightWidth: separatorWidth,
          },
        ]}
      >
        <TextInput
          returnKeyType="done"
          underlineColorAndroid="rgba(0,0,0,0)"
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
          value={text}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          style={[
            styles.input,
            {
              width: inputWidth,
              height,
              fontSize,
              color: textColor,
              borderLeftWidth: separatorWidth,
              borderRightWidth: separatorWidth,
              borderLeftColor: borderColor,
              borderRightColor: borderColor,
            },
            inputStyle,
          ]}
        />
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={() => requestAnimationFrame(increment)}
        style={[
          styles.button,
          {
            height: height - 2,
            width: buttonWidth,
            backgroundColor: rightButtonBackgroundColor,
          },
          rounded ? { borderTopRightRadius: radius, borderBottomRightRadius: radius } : null,
        ]}
      >
        <Ionicons name="add" size={fontSize} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}
