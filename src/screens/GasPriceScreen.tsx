// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import {
  View,
  Alert,
} from 'react-native';

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

function Row({ text, price }: any) {
  return (
    <DataTable.Row key={text}>
      <DataTable.Cell>
        {text}
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('Canada');
  const [gasPrices, setGasPrices] = useState<Array<number>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const fetchGasPrices = useCallback(async () => {
    try {
      const region = selectedValue === 'Canada' ? undefined : selectedValue;
      if (`${globalState.country}-${region}` in persistedGasPrices) {
        setGasPrices(persistedGasPrices[`${globalState.country}-${region}`]);
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
    }
  }, [selectedValue, globalState['Enable Requests']]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedValue]);

  DropDownPicker.setTheme('DARK');
  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <DropDownPicker
          textStyle={{ color: colors.secondary }}
          labelStyle={{ color: colors.secondary }}
          style={{ backgroundColor: colors.action }}
          containerStyle={{ width: 250 }}
          items={['Canada', ...provinces].map((location) => ({ label: location, value: location }))}
          open={dropdownOpen}
          setOpen={setDropdownOpen}
          setValue={setSelectedValue}
          value={selectedValue}
        />
        <Table
          data={gasPrices}
          headers={[
            { text: 'Location', numeric: false },
            { text: 'Price ($/L)', numeric: true },
          ]}
          Row={Row}
          style={{ width: '100%', marginTop: 16 }}
        />
      </View>
    </Page>
  );
}
