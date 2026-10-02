// React
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

// Firebase
import {
  AuthCredential, deleteUser, reauthenticateWithCredential, sendEmailVerification, signOut,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import MyModal from '../../components/Modal';
import Alert from '../../components/Alert';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ListRow from '../../components/ListRow';
import SectionHeader from '../../components/SectionHeader';
import SegmentedControl from '../../components/SegmentedControl';

import LoginSection from '../Auth/components/LoginSection';

// Global state stuff
import {
  useGlobalState, changeSetting, OPTIONS_SETTINGS,
} from '../../hooks/hooks';

// Helpers
import { DEV } from '../../helpers/env';
import { logEvent } from '../../helpers/analyticsHelper';
import { getDisplayName } from '../../helpers/userHelper';

// Styles
import { color, radius, space } from '../../styles/theme';

const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: space.xxl,
    alignItems: 'center',
    gap: space.xs,
  },
});

const unitLabels: Record<string, string> = {
  CA: 'Metric · L, km',
  US: 'Imperial · gal, mi',
};

function RowIcon({ name, tone = 'brand' }: { name: React.ComponentProps<typeof Ionicons>['name'], tone?: 'brand' | 'danger' }) {
  const isDanger = tone === 'danger';
  return (
    <View
      style={[styles.rowIcon, { backgroundColor: isDanger ? color.dangerSoft : color.primarySoft }]}
    >
      <Ionicons name={name} size={17} color={isDanger ? color.danger : color.primaryText} />
    </View>
  );
}

interface Props {
  navigation: {
    navigate: (str: string) => void,
  },
}

export default function SettingsScreen({ navigation }: Props) {
  const [user] = useAuthState(auth);
  const [modalVisible, setModalVisible] = useState(false);
  const [globalState, updateGlobalState] = useGlobalState();

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument] = useDocumentData(userDoc);
  const displayName = getDisplayName(user, userDocument);
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

    logEvent('request_email_verification');

    sendEmailVerification(user).then(() => {
      Alert('Check your inbox', `We sent a verification link to ${user.email}.`);
    }).catch((error) => {
      console.log(error);
    });
  };

  const showSignOutAlert = () => Alert(
    'Sign out?',
    'You can sign back in at any time.',
    [
      {
        text: 'Sign out',
        onPress: () => {
          logEvent('sign_out');
          signOut(auth).catch((exception) => Alert('Couldn’t sign out', exception.message));
        },
        style: 'destructive',
      },
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ],
  );

  const showDeleteConfirmationAlert = () => Alert(
    'Delete your account?',
    'Your trips and balances will be permanently removed. This can’t be undone.',
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

  const version = Constants.expoConfig?.version;

  return (
    <Page scroll safeTop={false} keyboardAvoiding={false}>
      <MyModal
        visible={modalVisible}
        title="Confirm it’s you"
        subtitle="Sign in again to delete your account."
        onDismiss={() => setModalVisible(false)}
      >
        <LoginSection onLogin={deleteAccount} mode="refresh" />
      </MyModal>

      {user ? (
        <Card style={[styles.account, { marginTop: space.sm }]}>
          <Avatar name={displayName || '?'} email={user.email ?? undefined} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title3" numberOfLines={1}>{displayName}</Text>
            <Text variant="footnote" tone="secondary" numberOfLines={1}>{user.email}</Text>
            <View style={{ marginTop: space.xs }}>
              {user.emailVerified
                ? <Badge label="Verified" tone="success" />
                : <Badge label="Email not verified" tone="warning" />}
            </View>
          </View>
        </Card>
      ) : (
        <Card padded={false} style={{ marginTop: space.sm }}>
          <ListRow
            title="Sign in"
            subtitle="Save trips and split them with friends"
            separator={false}
            leading={<RowIcon name="person-circle-outline" />}
            chevron
            onPress={() => navigation.navigate('Friends/Login')}
          />
        </Card>
      )}

      {Object.keys(OPTIONS_SETTINGS).map((setting) => (
        <View key={setting}>
          <SectionHeader title="Units" />
          <SegmentedControl
            options={OPTIONS_SETTINGS[setting].options.map((option) => ({
              value: option.toString(),
              label: unitLabels[option.toString()] ?? option.toString(),
            }))}
            value={globalState[setting]}
            onChange={(val) => changeSetting(setting, val, updateGlobalState)}
          />
        </View>
      ))}

      {user && (
        <>
          <SectionHeader title="Account" />
          <Card padded={false}>
            {!user.emailVerified && (
              <ListRow
                title="Resend verification email"
                leading={<RowIcon name="mail-outline" />}
                chevron
                onPress={sendEmailVerificationEmail}
              />
            )}
            <ListRow
              title="Sign out"
              leading={<RowIcon name="log-out-outline" />}
              onPress={showSignOutAlert}
            />
            <ListRow
              title="Delete account"
              destructive
              separator={false}
              leading={<RowIcon name="trash-outline" tone="danger" />}
              onPress={showDeleteConfirmationAlert}
            />
          </Card>
        </>
      )}

      <View style={styles.footer}>
        <Text variant="footnote" tone="tertiary">{`GasMeUp${version ? ` ${version}` : ''}`}</Text>
        {user && <Text variant="caption" tone="tertiary" selectable style={{ fontSize: 10 }}>{`ID ${user.uid}`}</Text>}
      </View>
    </Page>
  );
}
