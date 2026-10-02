// React
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { openURL } from 'expo-linking';

// Firebase
import {
  doc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../../../firebase';

// Helpers
import { logEvent } from '../../helpers/analyticsHelper';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import ListRow from '../../components/ListRow';
import EmptyState from '../../components/EmptyState';
import IconButton from '../../components/IconButton';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedControl from '../../components/SegmentedControl';

import SplitwiseLogin from './components/SplitwiseLogin';
import { balanceLabel } from './components/FriendRow';

// Styles
import { space } from '../../styles/theme';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';

const styles = StyleSheet.create({
  toggle: {
    marginTop: space.xl,
  },
});

function TableEmptyState() {
  return <EmptyState icon="people-outline" title="No Splitwise friends" message="Friends you add on Splitwise will show up here." />;
}

function Row({
  name, email, amount, isLast,
}: any) {
  const numericAmount = Number(amount);
  const { label, tone } = balanceLabel(numericAmount);
  return (
    <ListRow
      title={name}
      subtitle={label}
      separator={!isLast}
      leading={<Avatar name={name} email={email} />}
      trailing={tone === 'tertiary' ? undefined : (
        <Text variant="headline" tone={tone}>{`$${Math.abs(numericAmount).toFixed(2)}`}</Text>
      )}
    />
  );
}

function FooterRow() {
  return (
    <View style={{ padding: space.lg }}>
      <Button
        variant="secondary"
        title="Open Splitwise"
        fullWidth
        onPress={() => openURL('splitwise://app')}
      >
        <Image source={SplitwiseLogo} style={{ width: 20, height: 20 }} />
      </Button>
    </View>
  );
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

  return (
    <Page scroll keyboardAvoiding={false}>
      <ScreenHeader
        title="Splitwise"
        actions={splitwiseToken ? (
          <IconButton icon="log-out-outline" accessibilityLabel="Disconnect Splitwise" onPress={logout} />
        ) : undefined}
      />
      {secureUserDocLoading || splitwiseToken ? (
        <Table
          data={formattedBalances}
          Row={Row}
          loading={loading || secureUserDocLoading}
          EmptyState={TableEmptyState}
          FooterRow={FooterRow}
        />
      ) : (
        <SplitwiseLogin />
      )}
      <SegmentedControl
        style={styles.toggle}
        options={[
          { value: 'GasMeUp', label: 'GasMeUp' },
          { value: 'Splitwise', label: 'Splitwise' },
        ]}
        onChange={(value) => (value === 'GasMeUp' ? navigation.replace('Friends') : null)}
        value="Splitwise"
      />
    </Page>
  );
}
