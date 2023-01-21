// React
import React, { useMemo } from 'react';
import {
  Settings,
  View,
  Switch,
  Alert,
  ViewStyle,
} from 'react-native';

// External Components
import NumericInput from 'react-native-numeric-input';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// Components
import Page from '../components/Page';
import Button from '../components/Button';
import Text from '../components/Text';

// Global state stuff
import { useGlobalState, TOGGLE_SETTINGS } from '../hooks/hooks';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors, globalStyles } from '../styles/styles';

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
  TOGGLE_SETTINGS.forEach((setting) => {
    initialSettingsObject[setting] = !!Settings.get(setting);
  });

  const [globalState, updateGlobalState] = useGlobalState();

  const changeSetting = (setting: string, value: any) => {
    const newSetting: any = {};
    newSetting[setting] = value;

    Settings.set(newSetting);
    updateGlobalState(setting, value);
  };

  const SettingsSwitch = ({ name = '', value = false }) => useMemo(() => (
    <View style={styles.settingItem}>
      <Switch
        value={value}
        onValueChange={(val) => changeSetting(name, val)}
        trackColor={{ false: colors.primary, true: colors.action }}
        ios_backgroundColor={colors.primary}
      />
    </View>
  ), [value, name, globalState]);

  return (
    <Page>
      <View style={styles.headerContainer}>
        <Text style={globalStyles.title}> Settings</Text>
      </View>
      <View style={styles.mainContainer}>
        {TOGGLE_SETTINGS.map((setting) => (
          <View key={setting} style={styles.settingContainer}>
            <Text style={styles.settingsText}>{setting}</Text>
            <SettingsSwitch name={setting} value={globalState[setting]} />
          </View>
        ))}
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Gas Mileage (L / 100KM)</Text>
          <View style={styles.settingItem}>
            <NumericInput
              rounded
              totalHeight={18}
              totalWidth={120}
              containerStyle={{ backgroundColor: 'white' }}
              inputStyle={globalStyles.numericInput as ViewStyle}
              valueType="real"
              minValue={0.01}
              step={0.01}
              onChange={(value) => changeSetting('Gas Mileage', value)}
              value={globalState['Gas Mileage']}
            />
          </View>
        </View>
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
    </Page>
  );
}
