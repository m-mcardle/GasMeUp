import { TextInput } from 'react-native';

import { globalStyles } from '../styles/styles';

interface Props {
  value?: string,
  placeholder?: string,
  style?: object,
  onChangeText: (arg: string) => void
  onPressOut?: () => void
}

export default function Input(props: Props) {
  const {onChangeText, onPressOut, placeholder, style, value} = props;
  return (
    <TextInput value={value} style={globalStyles.input} placeholder={placeholder} onChangeText={onChangeText} onPressOut={onPressOut}/>
  )
}