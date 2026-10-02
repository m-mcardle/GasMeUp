// React imports
import React, {
  useCallback, useState, useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';

// Global State Stuff
import { useGlobalState, changeSetting } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Table from '../components/Table';
import Text from '../components/Text';
import Button from '../components/Button';
import Alert from '../components/Alert';
import ListRow from '../components/ListRow';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import SegmentedControl from '../components/SegmentedControl';

// Styles
import { space } from '../styles/theme';

// Mock Data
import { fetchData } from '../data/data';

// Helpers
import {
  convertGallonsToL,
  convertLtoGallons,
  convertGasPrice,
  convertGasPriceToString,
} from '../helpers/unitsHelper';
import { logEvent } from '../helpers/analyticsHelper';
import { provinces } from '../helpers/locationHelper';
import { friendlyError } from '../helpers/errorHelper';

interface RequestLookup {
  [key: string]: Array<any>
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    marginLeft: -space.md,
    marginTop: space.md,
  },
});

function Row({
  text, price, useAsGasPrice, locale, unit, setSelectedRegion, selectedCountry, isLast,
}: any) {
  const isCanada = selectedCountry === 'CA';
  const isProvince = isCanada && provinces.includes(text);
  const roundedCanadianPrice = Number(convertGasPrice(price, locale, 'CA').toFixed(2));
  return (
    <ListRow
      title={text}
      separator={!isLast}
      chevron={isProvince}
      accessibilityLabel={`${text}, $${price.toFixed(2)} ${unit}`}
      onPress={isProvince ? () => setSelectedRegion(text) : undefined}
      trailing={(
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Text variant="headline">{`$${price.toFixed(2)}`}</Text>
          <Button
            title="Use"
            size="sm"
            variant="secondary"
            accessibilityLabel={`Use ${text} price`}
            onPress={() => useAsGasPrice(roundedCanadianPrice)}
          />
        </View>
      )}
    />
  );
}

export default function GasPriceScreen({ navigation }: any) {
  const [globalState, updateGlobalState] = useGlobalState();
  const [{ selectedCountry, selectedRegion }, setSelected] = useState({ selectedCountry: 'CA', selectedRegion: '' });
  const setSelectedRegion = (region: string) => setSelected((prev) => (
    { ...prev, selectedRegion: region }
  ));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gasPrices, setGasPrices] = useState<Array<any>>([]);
  const [persistedGasPrices, setPersistedGasPrices] = useState<RequestLookup>({});

  const getRegionType = () => {
    if (selectedCountry === 'CA') {
      return 'province';
    }

    if (selectedCountry === 'USA') {
      return 'state';
    }
    return 'country';
  };

  const regionType = getRegionType();

  const fetchGasPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    logEvent('gas_price_screen_loaded', {
      country: selectedCountry,
    });

    try {
      // Try and use the cache if possible to avoid unnecessary requests
      if (selectedCountry + selectedRegion in persistedGasPrices) {
        setGasPrices(persistedGasPrices[selectedCountry + selectedRegion]);
        setLoading(false);
        return;
      }

      const gasPricesResponse = await fetchData('/gas-prices', { country: selectedCountry, region: selectedRegion });

      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const body = await gasPricesResponse.text();
        throw new Error(`Error: ${body} (${gasPricesResponse.status})`);
      }

      const { prices } = (await gasPricesResponse.json());

      if (selectedRegion) {
        const formattedGasPrices = prices.map((price: any) => ({
          ...price,
          key: price.city,
          text: price.city,
          price: price.price,
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
      console.warn(err);
      setError(friendlyError(err, 'Gas prices aren’t available right now.'));
      setGasPrices([]);
    }
    setLoading(false);
  }, [selectedRegion, selectedCountry]);

  useEffect(() => {
    fetchGasPrices();
  }, [selectedRegion, selectedCountry]);

  let gasPriceConversion = (gasPrice: number) => gasPrice;
  if (globalState.Locale === 'CA' && selectedCountry === 'USA') {
    // Convert $USD / Gal to $CAD / L
    gasPriceConversion = (gasPrice: number) => (
      convertLtoGallons(gasPrice) / globalState.exchangeRate
    );
  } else if (globalState.Locale === 'US' && (selectedCountry === 'CA' || selectedCountry === 'WORLD')) {
    // Convert $CAD / L to $USD / Gal
    gasPriceConversion = (gasPrice: number) => (
      convertGallonsToL(gasPrice) * globalState.exchangeRate
    );
  }

  const useAsGasPrice = (price: number) => {
    logEvent('custom_gas_price_set', {
      price: price.toString(),
      region_type: regionType,
      region: selectedRegion || 'none',
    });

    changeSetting('Custom Gas Price', { price, enabled: 'true' }, updateGlobalState);
    Alert('Gas price updated', `Trips will now use ${convertGasPriceToString(price, 'CA', globalState.Locale)}. You can change this from the Calculate tab.`, [
      {
        text: 'Done',
        onPress: () => navigation.navigate('Home', { screen: 'Calculate', pop: true }),
      },
    ]);
  };

  const unit = globalState.Locale === 'CA' ? '$CAD/L' : '$USD/gal';
  const regionNoun = { CA: 'Provinces', USA: 'States', WORLD: 'Countries' }[selectedCountry] ?? 'Regions';

  const pricesEmptyState = error
    ? (
      <EmptyState
        icon="cloud-offline-outline"
        tone="danger"
        title="Couldn’t load prices"
        message={error}
        action={<Button title="Try again" icon="refresh" size="sm" variant="secondary" onPress={fetchGasPrices} />}
      />
    )
    : <EmptyState icon="pricetags-outline" title="No prices here yet" message="Try another region." />;

  return (
    <Page scroll>
      <ScreenHeader
        title="Gas prices"
        subtitle={`Average regular price, in ${unit}`}
      />
      <SegmentedControl
        options={[
          { value: 'CA', label: 'Canada' },
          { value: 'USA', label: 'USA' },
          { value: 'WORLD', label: 'World' },
        ]}
        onChange={(value) => setSelected({ selectedCountry: value, selectedRegion: '' })}
        value={selectedCountry}
      />
      {selectedRegion ? (
        <Button
          variant="ghost"
          size="sm"
          icon="chevron-back"
          title="All provinces"
          style={styles.back}
          onPress={() => setSelectedRegion('')}
        />
      ) : null}
      <SectionHeader title={selectedRegion ? `Cities in ${selectedRegion}` : regionNoun} />
      <Table
        loading={loading}
        data={gasPrices.map((obj) => (
          {
            ...obj,
            price: gasPriceConversion(obj.price),
          }
        )).sort((a, b) => (a.text > b.text ? 1 : -1))}
        Row={(values: any) => Row({
          ...values,
          setSelectedRegion,
          useAsGasPrice,
          selectedCountry,
          unit,
          locale: globalState.Locale,
        })}
        emptyState={pricesEmptyState}
      />
      {!loading && gasPrices.length > 0 && (
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
          Tap Use to make a price your default for trips.
        </Text>
      )}
    </Page>
  );
}
