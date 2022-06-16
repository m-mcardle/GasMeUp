import { useState, useMemo } from 'react';

import {
  KeyboardAvoidingView,
  Settings,
  View,
  Switch,
} from 'react-native';
import Text from '../components/Text';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors } from '../styles/styles';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsObject>({
    'Setting 1': !!Settings.get('Setting 1'),
    'Setting 2': !!Settings.get('Setting 2'),
    'Setting 3': !!Settings.get('Setting 3'),
    'Setting 4': !!Settings.get('Setting 4'),
    'Setting 5': !!Settings.get('Setting 5'),
  });

  const changeSetting = (setting: string, value: Boolean) => {
    const newSetting: any = {};
    newSetting[setting] = value;

    Settings.set({ ...newSetting });
    setSettings((state) => ({ ...state, ...newSetting }));
  };

  const SettingsSwitch = ({ setting = '' }) => useMemo(() => (
    <Switch
      value={settings[setting]}
      onValueChange={(val) => changeSetting(setting, val)}
      trackColor={{ false: colors.primary, true: colors.tertiary }}
      ios_backgroundColor={colors.primary}
    />
  ), [settings]);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}> Settings</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 1:</Text>
          <SettingsSwitch setting="Setting 1" />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 2:</Text>
          <SettingsSwitch setting="Setting 2" />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 3:</Text>
          <SettingsSwitch setting="Setting 3" />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 4:</Text>
          <SettingsSwitch setting="Setting 4" />
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Setting 5:</Text>
          <SettingsSwitch setting="Setting 5" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
