import { ReactNode } from 'react';
import { Text } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode[] | ReactNode, 
  style?: object,
  onPress?: () => void
}

export default function AppText(props: Props) {
  const {children, style, onPress} = props;
  return (
    <Text style={[globalStyles.text, style]} onPress={onPress}>
      {children}
    </Text>
  )
}