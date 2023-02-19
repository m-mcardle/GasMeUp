// React
import React, { useMemo } from 'react';
import {
  View,
  Switch,
} from 'react-native';

// External Components
import { SegmentedButtons } from 'react-native-paper';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';

// Global state stuff
import {
  useGlobalState, changeSetting, DEV_TOGGLE_SETTINGS, OPTIONS_SETTINGS,
} from '../../hooks/hooks';

// Styles
import styles from '../../styles/SettingsScreen.styles';
import { colors } from '../../styles/styles';

export default function SettingsScreen() {
  const [user] = useAuthState(auth);
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
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Your name:</Text>
          <Text style={styles.settingValueText}>{user?.displayName ?? 'Unknown'}</Text>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Your UID:</Text>
          <Text style={styles.settingValueText}>{user?.uid ?? 'Unknown'}</Text>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Your email:</Text>
          <Text style={styles.settingValueText}>{user?.email ?? 'Unknown'}</Text>
        </View>
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Email verified?</Text>
          <Text style={styles.settingValueText}>{user?.emailVerified === true ? 'Yes' : 'No'}</Text>
        </View>
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
