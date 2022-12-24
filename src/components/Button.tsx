import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import PropTypes, { object } from 'prop-types';

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
      style={[globalStyles.button, (disabled ? globalStyles.disabledButton : null), style]}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
}

Button.propTypes = {
  onPress: PropTypes.func.isRequired,
  children: PropTypes.node,
  // eslint-disable-next-line react/forbid-prop-types
  style: object,
};

Button.defaultProps = {
  children: undefined,
  style: undefined,
  disabled: false,
};
