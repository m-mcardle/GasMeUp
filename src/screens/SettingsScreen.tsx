import React, { useMemo } from 'react';

import {
  KeyboardAvoidingView,
  Settings,
  View,
  Switch,
} from 'react-native';
import Text from '../components/Text';

// Global state stuff
import { useGlobalState, SETTINGS } from '../hooks/hooks';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors } from '../styles/styles';

export default function SettingsScreen() {
  const initialSettingsObject: any = {};
  SETTINGS.forEach((setting) => {
    initialSettingsObject[setting] = !!Settings.get(setting);
  });

  const [globalState, updateGlobalState] = useGlobalState();

  const changeSetting = (setting: string, value: Boolean) => {
    const newSetting: any = {};
    newSetting[setting] = value;

    Settings.set(newSetting);
    updateGlobalState(setting, value);
  };

  const SettingsSwitch = ({ name = '', value = false }) => useMemo(() => (
    <Switch
      style={styles.settingsSwitch}
      value={value}
      onValueChange={(val) => changeSetting(name, val)}
      trackColor={{ false: colors.primary, true: colors.tertiary }}
      ios_backgroundColor={colors.primary}
    />
  ), [value, name, globalState]);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}> Settings</Text>
      </View>
      <View style={styles.mainContainer}>
        {SETTINGS.map((setting) => (
          <View key={setting} style={styles.settingContainer}>
            <Text style={styles.settingsText}>{setting}</Text>
            <SettingsSwitch name={setting} value={globalState[setting]} />
          </View>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}
