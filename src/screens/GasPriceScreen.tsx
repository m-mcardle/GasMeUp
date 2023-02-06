// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import {
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DataTable } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Table from '../components/Table';
import Text from '../components/Text';

// Styles
import styles from '../styles/GasPriceScreen.styles';
import { colors } from '../styles/styles';

// Mock Data
import { fetchData } from '../data/data';

// Helpers
import { provinces } from '../helpers/locationHelper';

interface RequestLookup {
  [key: string]: Array<number>
}

function Row({ text, price, setSelectedValue }: any) {
  const isProvince = provinces.includes(text);
  return (
    <DataTable.Row
      key={text}
      onPress={() => (isProvince ? setSelectedValue(text) : setSelectedValue('Canada'))}
    >
      <DataTable.Cell>
        {!isProvince && <Ionicons name="chevron-back" size={12} color={colors.secondary} />}
        {text}
        {isProvince && <Ionicons name="chevron-forward" size={12} color={colors.secondary} />}
      </DataTable.Cell>
      <DataTable.Cell numeric>
        $
        {price.toFixed(2)}
      </DataTable.Cell>
    </DataTable.Row>
  );
}
export default function GasPriceScreen() {
  const [globalState] = useGlobalState();
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState('Canada');
  const [gasPrices, setGasPrices] = useState<Array<number>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);
    try {
      const region = selectedValue === 'Canada' ? undefined : selectedValue;
      if (`${globalState.country}-${region}` in persistedGasPrices) {
        setGasPrices(persistedGasPrices[`${globalState.country}-${region}`]);
        setLoading(false);
        return;
      }
      const gasPricesResponse = await fetchData(`/gas-prices?country=${globalState.country}&region=${region ?? ''}`, !globalState['Enable Requests']);

      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const error = await gasPricesResponse.text();
        throw new Error(`Error: ${error} (${gasPricesResponse.status})`);
      }

      const { prices } = (await gasPricesResponse.json());

      if (region) {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price, key: price.city, text: price.city,
        }));
        setGasPrices(formattedGasPrices);
        setPersistedGasPrices((prev) => ({ ...prev, [`${globalState.country}-${region}`]: formattedGasPrices }));
      } else {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price, key: price.province, text: price.province,
        }));
        setGasPrices(formattedGasPrices);
        setPersistedGasPrices((prev) => ({ ...prev, [`${globalState.country}-${region}`]: formattedGasPrices }));
      }
    } catch (err: any) {
      Alert.alert(err.message);
      setGasPrices([]);
    }
    setLoading(false);
  }, [selectedValue, globalState['Enable Requests']]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedValue]);

  DropDownPicker.setTheme('DARK');
  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <Table
          loading={loading}
          data={gasPrices}
          headers={[
            { text: 'Location', numeric: false },
            { text: 'Price ($/L)', numeric: true },
          ]}
          Row={(values) => Row({ ...values, setSelectedValue })}
          style={{ width: '100%', marginTop: 16 }}
        />
      </View>
    </Page>
  );
}
