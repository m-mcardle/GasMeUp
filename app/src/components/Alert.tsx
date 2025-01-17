import { Alert } from 'react-native';

export default function MyAlert(
  title: string,
  message: string | undefined = undefined,
  buttons: any[] = [],
  customOptions: any = {},
) {
  const options = {
    userInterfaceStyle: 'dark',
    ...customOptions,
  };

  Alert.alert(title ?? 'Unknown Error Has Occurred', message, buttons, options);
}
