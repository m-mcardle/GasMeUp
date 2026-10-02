/* eslint-disable react/jsx-props-no-spreading */

import React, { ReactNode, useRef } from 'react';
import {
  Animated, Pressable, PressableProps, StyleProp, ViewStyle,
} from 'react-native';

import { motion } from '../styles/theme';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode,
  style?: StyleProp<ViewStyle>,
  // Shrink slightly while pressed (buttons, cards). Rows use `pressedStyle` instead.
  scale?: boolean,
  pressedStyle?: StyleProp<ViewStyle>,
}

// Pressable with a spring "press" scale, used by every tappable surface in the app.
export default function ScalePressable({
  children, style, scale = true, pressedStyle, disabled, onPressIn, onPressOut, ...rest
}: Props) {
  const value = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    speed: 40,
    bounciness: 0,
  }).start();

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (scale) animateTo(motion.pressScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (scale) animateTo(1);
        onPressOut?.(e);
      }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[style, { transform: [{ scale: value }] }, pressed ? pressedStyle : null]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}
