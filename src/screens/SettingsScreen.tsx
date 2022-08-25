// React
import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Settings,
  View,
  Switch,
  Alert,
} from 'react-native';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// Components
import Button from '../components/Button';
import Text from '../components/Text';

// Global state stuff
import { useGlobalState, SETTINGS } from '../hooks/hooks';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors } from '../styles/styles';

const logout = () => {
  signOut(auth)
    .then(() => {
      console.log('signed out!');
    })
    .catch((exception) => {
      Alert.alert('Error', exception.message);
    });
};

export default function SettingsScreen() {
  const [user] = useAuthState(auth);

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
        {
          user
            ? (
              <Button onPress={logout}>
                <Text style={{ color: colors.primary, textAlign: 'center' }}>Log Out</Text>
              </Button>
            )
            : undefined
        }
      </View>
    </KeyboardAvoidingView>
  );
}
