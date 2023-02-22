// React
import React, { useMemo, useState } from 'react';
import {
  Alert,
  View,
  Switch,
} from 'react-native';

// External Components
import { Portal, SegmentedButtons } from 'react-native-paper';

// Firebase
import { AuthCredential, deleteUser, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import Button from '../../components/Button';
import MyModal from '../../components/Modal';

import LoginSection from '../../components/Login/LoginSection';

// Global state stuff
import {
  useGlobalState, changeSetting, DEV_TOGGLE_SETTINGS, OPTIONS_SETTINGS,
} from '../../hooks/hooks';

// Styles
import styles from '../../styles/SettingsScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

export default function SettingsScreen() {
  const [user] = useAuthState(auth);
  const [modalVisible, setModalVisible] = useState(false);
  const [globalState, updateGlobalState] = useGlobalState();

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const secureUserDoc = user?.uid ? doc(db, 'SecureUsers', user.uid) : undefined;

  const deleteAccount = (credential: AuthCredential) => {
    if (!user || !userDoc || !secureUserDoc) {
      console.log("Can't delete user, not signed in");
      return;
    }
    setModalVisible(false);

    reauthenticateWithCredential(user, credential).then(() => {
      console.log('User reauthenticated');
      console.log(userDoc.id, secureUserDoc.id, user.uid);
      deleteDoc(userDoc).then(() => {
        console.log('User document deleted');
        deleteDoc(secureUserDoc).then(() => {
          console.log('SecureUser document deleted');
          deleteUser(user).then(() => {
            Alert.alert('Account Deleted', 'Your account has been successefully deleted.');
          }).catch((error) => {
            console.log(error);
          });
        }).catch((error) => {
          console.log(error);
        });
      }).catch((error) => {
        console.log(error);
      });
    });
  };

  const showDeleteConfirmationAlert = () => Alert.alert(
    'Delete Account',
    'Are you sure you want to delete your account? This action cannot be undone.',
    [
      {
        text: 'Delete',
        onPress: () => setModalVisible(true),
        style: 'destructive',
      },
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ],
  );

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
      <Portal>
        <MyModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
        >
          <View style={globalStyles.centered}>
            <Text style={globalStyles.h2}>Please login again before you delete your account</Text>
            <LoginSection onLogin={deleteAccount} />
          </View>
        </MyModal>
      </Portal>
      <View style={styles.mainContainer}>
        {user && (
        <>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Your name:</Text>
            <Text style={styles.settingValueText}>{user?.displayName ?? 'Unknown'}</Text>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Your UID:</Text>
            <Text style={{ ...styles.settingValueText, fontSize: 8 }}>{user?.uid ?? 'Unknown'}</Text>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Your email:</Text>
            <Text style={styles.settingValueText}>{user?.email ?? 'Unknown'}</Text>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Email verified?</Text>
            <Text style={styles.settingValueText}>{user?.emailVerified === true ? 'Yes' : 'No'}</Text>
          </View>
        </>
        )}
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
        {user && (
        <View style={styles.settingContainer}>
          <Text style={styles.settingsText}>Delete Account?</Text>
          <Button
            style={{
              ...styles.settingItem, backgroundColor: 'red', paddingHorizontal: 0, margin: 0,
            }}
            onPress={showDeleteConfirmationAlert}
          >
            <Text style={{ color: 'white' }}>Delete</Text>
          </Button>
        </View>
        )}
      </View>
    </Page>
  );
}
