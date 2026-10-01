import React, { ReactNode } from 'react';
import { TouchableOpacity, Keyboard } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode,
  style?: object,
  disabled?: boolean,
  onPress: () => void
}

export default function Button(props: Props) {
  const {
    onPress,
    children,
    style,
    disabled,
  } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        globalStyles.button,
        style,
        (disabled ? globalStyles.disabledButton : null),
      ]}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
    >
      {children}
    </TouchableOpacity>
  );
}
