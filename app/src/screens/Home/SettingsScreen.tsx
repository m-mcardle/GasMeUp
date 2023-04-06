// React
import React, { useMemo, useState } from 'react';
import {
  View,
  Switch,
} from 'react-native';

// External Components
import { Portal, SegmentedButtons } from 'react-native-paper';

// Firebase
import {
  AuthCredential, deleteUser, reauthenticateWithCredential, sendEmailVerification,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import Button from '../../components/Button';
import MyModal from '../../components/Modal';
import Alert from '../../components/Alert';

import LoginSection from '../../components/Login/LoginSection';

// Global state stuff
import {
  useGlobalState, changeSetting, OPTIONS_SETTINGS,
} from '../../hooks/hooks';

// Helpers
import { DEV } from '../../helpers/env';
import { logEvent } from '../../helpers/analyticsHelper';

// Styles
import styles from '../../styles/SettingsScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

export default function SettingsScreen() {
  const [user] = useAuthState(auth);
  const [modalVisible, setModalVisible] = useState(false);
  const [globalState, updateGlobalState] = useGlobalState();

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const secureUserDoc = user?.uid ? doc(db, 'SecureUsers', user.uid) : undefined;

  const deleteAccount = (credential: AuthCredential, refreshToken?: string) => {
    if (!user || !userDoc || !secureUserDoc) {
      console.log("Can't delete user, not signed in");
      return;
    }

    logEvent('delete_account');

    setModalVisible(false);

    reauthenticateWithCredential(user, credential).then(() => {
      console.log('User reauthenticated');
      console.log(userDoc.id, secureUserDoc.id, user.uid);

      if (!DEV && refreshToken) {
        console.log('Revoking Apple token');
        fetch(`https://us-central1-gasmeup-7ce5f.cloudfunctions.net/revokeToken?refresh_token=${refreshToken}`)
          .then(async (response) => {
            const data = await response.text();
            console.log('Token revoke response:', data);
          })
          .catch((error) => {
            console.log('Error when revoking Apple token:', error);
          });
      }

      deleteDoc(userDoc).then(() => {
        console.log('User document deleted');
        deleteDoc(secureUserDoc).then(() => {
          console.log('SecureUser document deleted');
          deleteUser(user).then(() => {
            Alert('Account Deleted', 'Your account has been successfully deleted.');
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

  const sendEmailVerificationEmail = () => {
    if (!user) {
      console.log("Can't send email verification, not signed in");
      return;
    }

    sendEmailVerification(user).then(() => {
      Alert('Email Verification Sent', 'A verification email has been sent to your email address.');
    }).catch((error) => {
      console.log(error);
    });
  };

  const showDeleteConfirmationAlert = () => Alert(
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <Page keyboardAvoiding={false}>
      <Portal>
        <MyModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
        >
          <View style={globalStyles.centered}>
            <Text style={globalStyles.h2}>Please login again before you delete your account</Text>
            <LoginSection onLogin={deleteAccount} mode="refresh" />
          </View>
        </MyModal>
      </Portal>
      <View style={styles.mainContainer}>
        {user && (
        <View style={styles.settingGroup}>
          <View style={styles.settingContainer}>
            <Text style={styles.settingHeader}>User Details</Text>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Name:</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingValueText} numberOfLines={1}>{user?.displayName ?? 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>UID:</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingValueText} numberOfLines={1}>{user?.uid ?? 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Email:</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingValueText} numberOfLines={1}>{user?.email ?? 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Email Verified</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingValueText}>{user?.emailVerified === true ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>
        )}

        <View style={styles.settingGroup}>
          {Object.keys(OPTIONS_SETTINGS).map((setting) => (
            <View key={setting} style={styles.settingContainer}>
              <Text style={styles.settingsText}>{`${OPTIONS_SETTINGS[setting].label ?? setting}:`}</Text>
              <View style={styles.settingItem}>
                <SegmentedButtons
                  buttons={OPTIONS_SETTINGS[setting].options.map((option) => ({
                    label: option.toString(),
                    value: option.toString(),
                    style: {
                      backgroundColor: (option === globalState[setting]
                        ? colors.action
                        : colors.primary
                      ),
                    },
                  }))}
                  value={globalState[setting]}
                  onValueChange={(val: any) => changeSetting(setting, val, updateGlobalState)}
                  style={styles.settingItem}
                />
              </View>
            </View>
          ))}
          {user && !user.emailVerified && (
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Resend Email Verification:</Text>
            <View style={styles.settingItem}>
              <Button
                style={{ margin: 0, paddingHorizontal: 32 }}
                onPress={sendEmailVerificationEmail}
              >
                <Text style={{ color: 'white' }}>Request</Text>
              </Button>
            </View>
          </View>
          )}
          {user && (
          <View style={styles.settingContainer}>
            <Text style={styles.settingsText}>Delete Account:</Text>
            <View style={styles.settingItem}>
              <Button
                style={{ backgroundColor: 'red', margin: 0, paddingHorizontal: 32 }}
                onPress={showDeleteConfirmationAlert}
              >
                <Text style={{ color: 'white' }}>Delete</Text>
              </Button>
            </View>
          </View>
          )}
        </View>
      </View>
    </Page>
  );
}
