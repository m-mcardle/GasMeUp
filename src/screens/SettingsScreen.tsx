// React
import React, { useMemo } from 'react';
import {
  Settings,
  View,
  Switch,
  ViewStyle,
  Platform,
} from 'react-native';

// External Components
import NumericInput from 'react-native-numeric-input';

// Components
import Page from '../components/Page';
import Text from '../components/Text';

// Global state stuff
import { useGlobalState, DEV_TOGGLE_SETTINGS, TOGGLE_SETTINGS } from '../hooks/hooks';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors, globalStyles } from '../styles/styles';

export default function SettingsScreen() {
  const [globalState, updateGlobalState] = useGlobalState();

  const changeSetting = (setting: string, value: any) => {
    const newSetting: any = {};
    newSetting[setting] = value;

    if (Platform.OS === 'ios') { Settings.set(newSetting); }
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
        {process.env.NODE_ENV === 'development' && Object.keys(DEV_TOGGLE_SETTINGS).map((setting) => (
          <View key={setting} style={styles.settingContainer}>
            <Text style={styles.settingsText}>{setting}</Text>
            <SettingsSwitch name={setting} value={globalState[setting]} />
          </View>
        ))}
        {Object.keys(TOGGLE_SETTINGS).map((setting) => (
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
              totalHeight={25}
              totalWidth={150}
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
      </View>
    </Page>
  );
}
