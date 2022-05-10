import { TextInput } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  placeholder?: string,
  style?: object,
  onChangeText: (arg: string) => void
}

export default function Input(props: Props) {
  const {onChangeText, placeholder, style} = props;
  return (
    <TextInput style={globalStyles.input} placeholder={placeholder} onChangeText={onChangeText} />
  )
}