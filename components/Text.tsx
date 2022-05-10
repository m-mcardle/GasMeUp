import { ReactNode } from 'react';
import { Text } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  children?: ReactNode[] | ReactNode, 
  style?: object
}

export default function AppText(props: Props) {
  const {children, style} = props;
  return (
    <Text style={[globalStyles.text, style]}>
      {children}
    </Text>
  )
}