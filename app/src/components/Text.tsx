/* eslint-disable react/jsx-props-no-spreading */

import React, { ReactNode } from 'react';
import { Text } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode[] | ReactNode,
  style?: object,
  onPress?: () => void,
  numberOfLines?: number,
}

export default function AppText(props: Props) {
  const {
    children,
    style,
    numberOfLines,
    onPress,
  } = props;

  return (
    <Text
      {...props}
      style={[globalStyles.text, style]}
      onPress={onPress}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
