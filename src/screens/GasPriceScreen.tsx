// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import {
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DataTable, SegmentedButtons } from 'react-native-paper';

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

function Row({ text, price, setSelectedRegion }: any) {
  const isProvince = provinces.includes(text);
  return (
    <DataTable.Row
      key={text}
      onPress={() => (isProvince ? setSelectedRegion(text) : setSelectedRegion(''))}
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

function USARow({ text, price }: any) {
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

export default function GasPriceScreenV2() {
  const [globalState] = useGlobalState();
  const [{ selectedCountry, selectedRegion }, setSelected] = useState({ selectedCountry: 'CA', selectedRegion: '' });
  const setSelectedRegion = (region: string) => setSelected((prev) => (
    { ...prev, selectedRegion: region }
  ));

  const [loading, setLoading] = useState(false);
  const [gasPrices, setGasPrices] = useState<Array<number>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const regionType = selectedCountry === 'CA' ? 'province' : 'state';

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedCountry + selectedRegion in persistedGasPrices) {
        setGasPrices(persistedGasPrices[selectedCountry + selectedRegion]);
        setLoading(false);
        return;
      }

      const regionQueryParam = selectedRegion ? `&region=${selectedRegion}` : '';
      const gasPricesResponse = await fetchData(`/gas-prices?country=${selectedCountry}${regionQueryParam}`, !globalState['Enable Requests']);

      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const error = await gasPricesResponse.text();
        throw new Error(`Error: ${error} (${gasPricesResponse.status})`);
      }

      const { prices } = (await gasPricesResponse.json());

      if (selectedRegion) {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price, key: price.city, text: price.city, price: price.price / 100,
        }));
        setGasPrices(formattedGasPrices);
        setPersistedGasPrices((prev) => ({
          ...prev,
          [selectedCountry + selectedRegion]: formattedGasPrices,
        }));
      } else {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price, key: price[regionType], text: price[regionType],
        }));
        setGasPrices(formattedGasPrices);
        setPersistedGasPrices((prev) => ({
          ...prev,
          [selectedCountry + selectedRegion]: formattedGasPrices,
        }));
      }
    } catch (err: any) {
      Alert.alert(err.message);
      setGasPrices([]);
    }
    setLoading(false);
  }, [selectedRegion, selectedCountry, globalState['Enable Requests']]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedRegion, selectedCountry]);

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <Table
          loading={loading}
          data={gasPrices}
          headers={[
            { text: 'Location', numeric: false },
            { text: (selectedCountry === 'CA' ? 'Price ($/L)' : 'Price ($/gal)'), numeric: true },
          ]}
          Row={(values) => (selectedCountry === 'CA' ? Row({ ...values, setSelectedRegion }) : USARow({ ...values }))}
          style={{ width: '100%', marginTop: 16 }}
        />
        <SegmentedButtons
          style={{ marginTop: 'auto', marginBottom: 0 }}
          buttons={[
            {
              value: 'CA',
              label: 'Canada',
              style: { backgroundColor: selectedCountry === 'CA' ? colors.action : colors.primary },
            },
            {
              value: 'USA',
              label: 'USA',
              style: { backgroundColor: selectedCountry === 'USA' ? colors.action : colors.primary },
            },
          ]}
          onValueChange={(value) => setSelected({ selectedCountry: value, selectedRegion: '' })}
          value={selectedCountry}
        />
      </View>
    </Page>
  );
}
