// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import {
  View,
} from 'react-native';

import { DataTable, SegmentedButtons } from 'react-native-paper';

// Global State Stuff
import { useGlobalState, changeSetting } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Table from '../components/Table';
import Text from '../components/Text';
import Button from '../components/Button';
import Alert from '../components/Alert';

// Styles
import styles from '../styles/GasPriceScreen.styles';
import { colors } from '../styles/styles';

// Mock Data
import { fetchData } from '../data/data';

// Helpers
import {
  convertDollarsPerGalToDollarsPerL,
  convertDollarsPerLToDollarsPerGal,
  convertGasPrice,
  convertGasPriceToString,
} from '../helpers/unitsHelper';
import { logEvent } from '../helpers/analyticsHelper';

interface RequestLookup {
  [key: string]: Array<any>
}

function Row({
  text, price, useAsGasPrice, locale,
}: any) {
  const roundedPrice = price.toFixed(2);
  const roundedCanadianPrice = Number(convertGasPrice(price, locale, 'CA').toFixed(2));
  return (
    <DataTable.Row
      key={text}
    >
      <DataTable.Cell style={{ minWidth: 150 }}>
        {text}
      </DataTable.Cell>
      <DataTable.Cell numeric>
        $
        {roundedPrice}
      </DataTable.Cell>
      <DataTable.Cell
        style={{ maxWidth: 64, justifyContent: 'center' }}
        onPress={() => useAsGasPrice(roundedCanadianPrice)}
        numeric
      >
        <Button
          style={{ paddingHorizontal: 8, padding: 2, margin: 0 }}
          onPress={() => useAsGasPrice(roundedCanadianPrice)}
        >
          <Text>Use</Text>
        </Button>
      </DataTable.Cell>
    </DataTable.Row>
  );
}

export default function GasPriceScreen({ navigation }: any) {
  const [globalState, updateGlobalState] = useGlobalState();
  const [selectedCountry, setSelected] = useState('CA');

  const [loading, setLoading] = useState(false);
  const [gasPrices, setGasPrices] = useState<Array<any>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const regionType = selectedCountry === 'CA' ? 'province' : 'state';

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);

    logEvent('gas_price_screen_loaded', {
      country: selectedCountry,
    });

    try {
      // Try and use the cache if possible to avoid unnecessary requests
      if (selectedCountry in persistedGasPrices) {
        setGasPrices(persistedGasPrices[selectedCountry]);
        setLoading(false);
        return;
      }

      const gasPricesResponse = await fetchData('/gas-prices', { country: selectedCountry });

      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const error = await gasPricesResponse.text();
        throw new Error(`Error: ${error} (${gasPricesResponse.status})`);
      }

      const { prices } = (await gasPricesResponse.json());

      const formattedGasPrices = prices.map((price: any) => ({
        ...price,
        key: price[regionType],
        text: price[regionType],
      }));
      setGasPrices(formattedGasPrices);
      setPersistedGasPrices((prev) => ({
        ...prev,
        [selectedCountry]: formattedGasPrices,
      }));
    } catch (err: any) {
      Alert(err.message);
      setGasPrices([]);
    }
    setLoading(false);
  }, [selectedCountry]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedCountry]);

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

  const useAsGasPrice = (price: number) => {
    logEvent('custom_gas_price_set', {
      price: price.toString(),
      region_type: regionType,
    });

    changeSetting('Custom Gas Price', { price, enabled: 'true' }, updateGlobalState);
    Alert('Gas Price Updated', `Your gas price has been updated to ${convertGasPriceToString(price, 'CA', globalState.Locale)}`, [
      {
        text: 'OK',
        onPress: () => navigation.navigate('Calculate'),
      },
    ]);
  };

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Gas Prices</Text>
        <Table
          loading={loading}
          data={gasPrices.map((obj) => (
            {
              ...obj,
              price: gasPriceConversion(obj.price),
            }
          )).sort((a, b) => (a.text > b.text ? 1 : -1))}
          headers={[
            { text: 'Location', numeric: false, style: { minWidth: 150 } },
            { text: (globalState.Locale === 'CA' ? 'Price ($/L)' : 'Price ($/gal)'), numeric: true },
            { text: 'Use', numeric: true, style: { justifyContent: 'center', maxWidth: 64 } },
          ]}
          Row={(values) => Row({
            ...values,
            useAsGasPrice,
            locale: globalState.Locale,
          })}
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
          onValueChange={(value) => setSelected(value)}
          value={selectedCountry}
        />
      </View>
    </Page>
  );
}
