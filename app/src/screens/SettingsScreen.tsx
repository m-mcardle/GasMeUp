// React
import React, { useMemo } from 'react';
import {
  View,
  Switch,
} from 'react-native';

// External Components
import { SegmentedButtons } from 'react-native-paper';

// Components
import Page from '../components/Page';
import Text from '../components/Text';

// Global state stuff
import {
  useGlobalState, changeSetting, DEV_TOGGLE_SETTINGS, OPTIONS_SETTINGS,
} from '../hooks/hooks';

// Styles
import styles from '../styles/SettingsScreen.styles';
import { colors } from '../styles/styles';

export default function SettingsScreen() {
  const [globalState, updateGlobalState] = useGlobalState();

  const SettingsSwitch = ({ name = '', value = false }) => useMemo(() => (
    <View style={styles.settingItem}>
      <Switch
        value={value}
        onValueChange={(val) => changeSetting(name, val, updateGlobalState)}
        trackColor={{ false: colors.primary, true: colors.action }}
        ios_backgroundColor={colors.primary}
      />
    </View>
  ), [value, name, globalState]);

  return (
    <Page>
      <View style={styles.mainContainer}>
        {process.env.NODE_ENV === 'development' && Object.keys(DEV_TOGGLE_SETTINGS).map((setting) => (
          <View key={setting} style={styles.settingContainer}>
            <Text style={styles.settingsText}>{setting}</Text>
            <SettingsSwitch name={setting} value={globalState[setting]} />
          </View>
        ))}
        {Object.keys(OPTIONS_SETTINGS).map((setting) => (
          <View key={setting} style={styles.settingContainer}>
            <Text style={styles.settingsText}>{OPTIONS_SETTINGS[setting].label ?? setting}</Text>
            <SegmentedButtons
              buttons={OPTIONS_SETTINGS[setting].options.map((option) => ({
                label: option,
                value: option,
              }))}
              value={globalState[setting]}
              onValueChange={(val: any) => changeSetting(setting, val, updateGlobalState)}
              style={styles.settingItem}
            />
          </View>
        ))}
      </View>
    </Page>
  );
}