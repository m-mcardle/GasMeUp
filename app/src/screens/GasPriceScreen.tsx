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
import { provinces, states } from '../helpers/locationHelper';
import { convertDollarsPerGalToDollarsPerL, convertDollarsPerLToDollarsPerGal } from '../helpers/unitsHelper';

interface RequestLookup {
  [key: string]: Array<any>
}

function Row({ text, price, setSelectedRegion }: any) {
  const isProvince = provinces.includes(text);
  const isState = !isProvince && states.includes(text);
  return (
    <DataTable.Row
      key={text}
      onPress={() => (isProvince ? setSelectedRegion(text) : setSelectedRegion(''))}
    >
      <DataTable.Cell>
        {!isProvince && !isState && <Ionicons name="chevron-back" size={12} color={colors.secondary} />}
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
  const [{ selectedCountry, selectedRegion }, setSelected] = useState({ selectedCountry: 'CA', selectedRegion: '' });
  const setSelectedRegion = (region: string) => setSelected((prev) => (
    { ...prev, selectedRegion: region }
  ));

  const [loading, setLoading] = useState(false);
  const [gasPrices, setGasPrices] = useState<Array<any>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const regionType = selectedCountry === 'CA' ? 'province' : 'state';

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);
    try {
      // Try and use the cache if possible to avoid unnecessary requests
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
          ...price,
          key: price.city,
          text: price.city,
          price: price.price / 100,
        }));
        setGasPrices(formattedGasPrices);
        setPersistedGasPrices((prev) => ({
          ...prev,
          [selectedCountry + selectedRegion]: formattedGasPrices,
        }));
      } else {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price,
          key: price[regionType],
          text: price[regionType],
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

  let gasPriceConversion = (gasPrice: number) => gasPrice;
  if (globalState.Locale === 'CA' && selectedCountry === 'USA') {
    gasPriceConversion = (gasPrice: number) => (
      convertDollarsPerLToDollarsPerGal(gasPrice) / globalState.exchangeRate
    );
  } else if (globalState.Locale === 'US' && selectedCountry === 'CA') {
    gasPriceConversion = (gasPrice: number) => (
      convertDollarsPerGalToDollarsPerL(gasPrice) * globalState.exchangeRate
    );
  }

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <Table
          loading={loading}
          data={gasPrices.map((obj) => ({ ...obj, price: gasPriceConversion(obj.price) }))}
          headers={[
            { text: 'Location', numeric: false },
            { text: (globalState.Locale === 'CA' ? 'Price ($/L)' : 'Price ($/gal)'), numeric: true },
          ]}
          Row={(values) => Row({ ...values, setSelectedRegion })}
          style={styles.gasPriceTable}
          scrollable
        />
        <SegmentedButtons
          style={styles.selectionButtons}
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
