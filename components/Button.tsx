import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode,
  style?: object,
  onPress: () => void
}

export default function Button(props: Props) {
  const {onPress, children, style} = props;
  return (
    <TouchableOpacity style={globalStyles.button} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )
}