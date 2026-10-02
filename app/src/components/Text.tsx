/* eslint-disable react/jsx-props-no-spreading */

import React, { ReactNode } from 'react';
import {
  Text, TextProps, StyleProp, TextStyle,
} from 'react-native';

import { color, type, TypeVariant } from '../styles/theme';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'danger' | 'onPrimary';

const toneColor: Record<TextTone, string> = {
  primary: color.text,
  secondary: color.textSecondary,
  tertiary: color.textTertiary,
  brand: color.primaryText,
  success: color.success,
  danger: color.danger,
  onPrimary: color.textOnPrimary,
};

interface Props extends Omit<TextProps, 'style'> {
  children?: ReactNode[] | ReactNode,
  variant?: TypeVariant,
  tone?: TextTone,
  align?: TextStyle['textAlign'],
  style?: StyleProp<TextStyle>,
}

export default function AppText({
  children,
  variant = 'body',
  tone = 'primary',
  align,
  style,
  ...rest
}: Props) {
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        type[variant],
        { color: toneColor[tone] },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
