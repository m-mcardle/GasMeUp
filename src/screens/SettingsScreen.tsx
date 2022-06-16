import { useState } from 'react';

import {
  KeyboardAvoidingView,
  Settings,
  View,
  Switch,
} from 'react-native';
import Text from '../components/Text';

// Styles
// import { colors } from '../styles/styles';
import styles from '../styles/SettingsScreen.styles';

export default function SettingsScreen() {
  const [data, setData] = useState<boolean>(Settings.get('data') ?? false);

  const storeData = () => {
    Settings.set({ data: !data });
    setData(Settings.get('data'));
  };

  console.log(data);
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}> Settings</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 1:</Text>
          <Switch value={data} onChange={storeData} />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 2:</Text>
          <Switch />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 2:</Text>
          <Switch />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 3:</Text>
          <Switch />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 4:</Text>
          <Switch />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 5:</Text>
          <Switch />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
