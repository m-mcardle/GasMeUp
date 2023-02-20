// React
import React, { useEffect, useState } from 'react';
import {
  View, Image,
} from 'react-native';

import { openURL } from 'expo-linking';

import { DataTable } from 'react-native-paper';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { getIcon } from '../../helpers/iconHelper';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';

// Styles
import styles from '../../styles/FriendsScreen.styles';
import { colors } from '../../styles/styles';
import Button from '../../components/Button';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';

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
        <Image
          style={{ width: 32, height: 32, borderRadius: 64 }}
          source={getIcon({ email, name })}
        />
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

export default function SplitwiseScreen() {
  const [globalState] = useGlobalState();
  const [data, setData] = useState<any>({});

  const { splitwiseToken } = globalState;

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://www.splitwise.com/api/v3.0/get_friends', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${splitwiseToken}`,
        },
      });

      const json = await response.json();
      console.log(JSON.stringify(json, null, 2));
      setData(json);
    };

    if (splitwiseToken) {
      fetchData();
    }
  }, [splitwiseToken]);

  const formattedBalances = data?.friends?.map((friend: any) => ({
    name: `${friend.first_name} ${friend.last_name}`,
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
    <Page>
      <Table
        title="Friends"
        data={formattedBalances}
        headers={headers}
        Row={Row}
        style={styles.table}
        EmptyState={TableEmptyState}
        scrollable
      />
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
    </Page>
  );
}
