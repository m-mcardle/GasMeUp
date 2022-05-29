import { useState } from 'react';
import { KeyboardAvoidingView, Settings, View } from 'react-native';
import Button from '../components/Button';
import Text from '../components/Text';

import styles from '../styles/SettingsScreen.style';

export default function SettingsScreen() {
  const [data, setData] = useState<boolean>(Settings.get('data') ?? false);

  const storeData = () => {
    Settings.set({ data: !data });
    setData(Settings.get('data'));
  };

  console.log(data);
  return (
    <KeyboardAvoidingView style={styles.main}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>Use Mock Data:</Text>
          <Button onPress={storeData}>
            <Text style={styles.statBoxText}>{data.toString()}</Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
