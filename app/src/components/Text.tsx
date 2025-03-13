/* eslint-disable react/jsx-props-no-spreading */

import React, { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';

import PropTypes from 'prop-types';

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

AppText.propTypes = {
  onPress: PropTypes.func,
  children: PropTypes.node,
  // @ts-ignore
  style: PropTypes.shape(TextStyle),
};
