// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import {
  View,
  Alert,
} from 'react-native';

import { DataTable, SegmentedButtons } from 'react-native-paper';

// Global State Stuff
import { useGlobalState } from '../../hooks/hooks';

// Components
import Page from '../../components/Page';
import Table from '../../components/Table';
import Text from '../../components/Text';

// Styles
import styles from '../../styles/GasPriceScreen.styles';

// Mock Data
import { fetchData } from '../../data/data';

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
export default function GasPriceScreenUSA({ changeCountry }: any) {
  const [globalState] = useGlobalState();
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState('USA');
  const [gasPrices, setGasPrices] = useState<Array<number>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);
    try {
      if (globalState.country in persistedGasPrices) {
        setGasPrices(persistedGasPrices[globalState.country]);
        setLoading(false);
        return;
      }

      const gasPricesResponse = await fetchData('/gas-prices?country=USA', !globalState['Enable Requests']);

      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const error = await gasPricesResponse.text();
        throw new Error(`Error: ${error} (${gasPricesResponse.status})`);
      }

      const { prices } = (await gasPricesResponse.json());

      const formattedGasPrices = prices.map((price: any) => ({
        ...price, key: price.state, text: price.state,
      }));
      setGasPrices(formattedGasPrices);
      setPersistedGasPrices((prev) => ({ ...prev, [globalState.country]: formattedGasPrices }));
    } catch (err: any) {
      Alert.alert(err.message);
      setGasPrices([]);
    }
    setLoading(false);
  }, [selectedValue, globalState['Enable Requests']]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedValue]);

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <Table
          loading={loading}
          data={gasPrices}
          headers={[
            { text: 'State', numeric: false },
            { text: 'Price ($/gal)', numeric: true },
          ]}
          Row={(values) => Row({ ...values, setSelectedValue })}
          style={{ width: '100%', marginTop: 16 }}
        />
        <SegmentedButtons
          buttons={[
            {
              value: 'Canada',
              label: 'Canada',
            },
            {
              value: 'USA',
              label: 'USA',
            },
          ]}
          onValueChange={(value) => value === 'Canada' && changeCountry()}
          value="USA"
        />
      </View>
    </Page>
  );
}
