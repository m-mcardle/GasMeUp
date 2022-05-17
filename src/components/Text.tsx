import { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';

import PropTypes from 'prop-types';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode[] | ReactNode,
  style?: object,
  onPress?: () => void
}

export default function AppText(props: Props) {
  const { children, style, onPress } = props;
  return (
    <Text style={[globalStyles.text, style]} onPress={onPress}>
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

AppText.defaultProps = {
  onPress: undefined,
  children: undefined,
  style: undefined,
};
