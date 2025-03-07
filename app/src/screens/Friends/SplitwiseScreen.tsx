// React
import React, { useEffect, useState } from 'react';
import {
  View, Image, TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { openURL } from 'expo-linking';

import { DataTable, SegmentedButtons } from 'react-native-paper';

// Firebase
import {
  doc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Helpers
import { getIcon } from '../../helpers/iconHelper';
import { logEvent } from '../../helpers/analyticsHelper';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';
import Button from '../../components/Button';

import SplitwiseLogin from './components/SplitwiseLogin';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';
// @ts-ignore
import GasMeUpLogo from '../../../assets/car.png';

function TableEmptyState() {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.secondary, fontSize: 24 }}>No Friends</Text>
      <Text style={{ color: colors.secondary, fontSize: 10 }}>
        Add some friends and then they will show up here!
      </Text>
    </View>
  );
}

function Row({ name, email, amount }: any) {
  const numericAmount = Number(amount);
  return (
    <DataTable.Row
      key={name}
    >
      <DataTable.Cell style={{ maxWidth: '15%', justifyContent: 'center', alignContent: 'center' }}>
        <View>
          <Image
            style={{ width: 32, height: 32, borderRadius: 64 }}
            source={getIcon({ email, name })}
          />
        </View>
      </DataTable.Cell>
      <DataTable.Cell textStyle={{ color: colors.secondary }}>
        {name}
      </DataTable.Cell>
      <DataTable.Cell numeric>
        <Text style={numericAmount < 0 ? { color: 'red' } : { color: colors.secondary }}>
          $
          {numericAmount < 0 ? (numericAmount * -1).toFixed(2) : numericAmount.toFixed(2)}
        </Text>
      </DataTable.Cell>
    </DataTable.Row>
  );
}

function FooterRow() {
  return (
    <DataTable.Row
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.darkestGray,
        borderBottomWidth: 1,
        borderBottomColor: colors.darkestGray,
        height: 64,
      }}
    >
      <View style={{ width: '100%', alignSelf: 'center' }}>
        <Button
          style={styles.splitwiseButton}
          onPress={() => openURL('splitwise://app')}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={SplitwiseLogo} style={{ width: 24, height: 24 }} />
            <Text>
              View More
            </Text>
          </View>
        </Button>
      </View>
    </DataTable.Row>
  );
}

function GasMeUpIconComponent({ size }: { size: number }) {
  return <Image source={GasMeUpLogo} style={{ width: size, height: size }} />;
}

function SplitwiseIconComponent({ size }: { size: number }) {
  return <Image source={SplitwiseLogo} style={{ width: size, height: size }} />;
}

interface Props {
  navigation: {
    navigate: (str: string) => {},
    replace: (str: string) => {},
    goBack: () => {}
  },
}

export default function SplitwiseScreen({ navigation } : Props) {
  const [friendsData, setFriendsData] = useState<Array<any>>([]);

  const [user] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;

  const secureUserDoc = user?.uid ? doc(db, 'SecureUsers', user.uid) : undefined;
  const [secureUserDocument, secureUserDocLoading] = useDocumentData(secureUserDoc);

  const splitwiseToken = secureUserDocument?.splitwiseToken;

  const [loading, setLoading] = useState(true);

  const logout = () => {
    if (!secureUserDoc || !userDoc) { return; }

    logEvent('splitwise_logout');

    updateDoc(secureUserDoc, {
      splitwiseToken: '',
    });

    updateDoc(userDoc, {
      splitwiseUID: '',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://www.splitwise.com/api/v3.0/get_friends', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${splitwiseToken}`,
        },
      });

      const json = await response.json();
      if (json.error && json.error.includes('not logged in') && secureUserDoc) {
        console.log('Splitwise token expired');
        updateDoc(secureUserDoc, {
          splitwiseToken: null,
        });
      }
      setFriendsData(json.friends);
      setLoading(false);
    };

    if (splitwiseToken) {
      setLoading(true);
      fetchData();
    }
  }, [splitwiseToken]);

  const formattedBalances = friendsData?.map((friend: any) => ({
    name: `${friend.first_name ?? ''} ${friend.last_name ?? ''}`.trim(),
    amount: friend.balance[0]?.amount ?? 0,
    uid: friend.id,
    key: friend.id,
    email: friend.email,
    groups: friend.groups,
  })).sort((a: any, b: any) => a.amount - b.amount) ?? [];

  const headers = [
    { text: '', numeric: false, style: { maxWidth: '15%' } },
    { text: 'Friend', numeric: false },
    { text: 'Amount Owed', numeric: true },
  ];

  return (
    <Page keyboardAvoiding={false}>
      {secureUserDocLoading || splitwiseToken ? (
        <>
          <View style={globalStyles.headerSection}>
            <TouchableOpacity
              onPress={logout}
            >
              <Ionicons name="log-out" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Table
            title="Friends"
            data={formattedBalances}
            headers={headers}
            Row={Row}
            style={styles.table}
            loading={loading || secureUserDocLoading}
            EmptyState={TableEmptyState}
            FooterRow={FooterRow}
            scrollable
          />
        </>
      ) : (
        <SplitwiseLogin />
      )}
      <SegmentedButtons
        style={styles.toggleButton}
        buttons={[
          {
            value: 'GasMeUp',
            label: 'GasMeUp',
            style: { backgroundColor: colors.primary },
            icon: GasMeUpIconComponent,
          },
          {
            value: 'Splitwise',
            label: 'Splitwise',
            style: { backgroundColor: colors.splitwiseGreen },
            icon: SplitwiseIconComponent,
          },
        ]}
        onValueChange={(value) => (value === 'GasMeUp' ? navigation.replace('Friends') : null)}
        value="Splitwise"
      />
    </Page>
  );
}
