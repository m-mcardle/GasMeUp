import { ReactNode } from 'react';
import { TouchableOpacity, ViewPropTypes } from 'react-native';

import PropTypes from 'prop-types';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode,
  style?: object,
  onPress: () => void
}

export default function Button(props: Props) {
  const { onPress, children, style } = props;
  return (
    <TouchableOpacity style={[globalStyles.button, style]} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

Button.propTypes = {
  onPress: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: ViewPropTypes.style,
};

Button.defaultProps = {
  children: undefined,
  style: undefined,
};
