// React imports
import React, {
  useState, useEffect, useRef,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Global State Stuff
import { useGlobalState, changeSetting } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import AutocompleteInput from '../components/AutocompleteInput';
import Alert from '../components/Alert';

// Mock Data
import { fetchData } from '../data/data';

// Helpers
import { convertFuelEfficiency, convertFuelEfficiencyToString } from '../helpers/unitsHelper';
import { logEvent } from '../helpers/analyticsHelper';

// Styles
import { color, radius, space } from '../styles/theme';

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
    gap: space.md,
  },
  tiles: {
    gap: space.sm,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    gap: space.md,
  },
  loading: {
    paddingVertical: space.xxl,
  },
});

function FieldIcon({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) {
  return <Ionicons name={name} size={18} color={color.textTertiary} />;
}

enum ActiveInput {
  None,
  Year,
  Make,
  Model,
  Trim,
}

export default function CarScreen({ navigation }: any) {
  const [globalState, updateGlobalState] = useGlobalState();
  const stateVehicle = globalState.Vehicle;
  const stateTrim = stateVehicle.trimValue
    ? { text: stateVehicle.trimText, value: stateVehicle.trimValue }
    : undefined;

  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.None);

  const [yearInput, setYearInput] = useState('');
  const [makeInput, setMakeInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [trimInput, setTrimInput] = useState('');

  const [selectedYear, setSelectedYear] = useState(stateVehicle.year || '');
  const [selectedMake, setSelectedMake] = useState(stateVehicle.make || '');
  const [selectedModel, setSelectedModel] = useState(stateVehicle.model || '');
  const [selectedTrim, setSelectedTrim] = useState<any>(stateTrim || {});

  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState<Array<string>>([]);
  const [makes, setMakes] = useState<Array<string>>([]);
  const [models, setModels] = useState<Array<string>>([]);
  const [trims, setTrims] = useState<Array<any>>([]);

  const [vehicle, setVehicle] = useState<any>({});

  useEffect(() => {
    async function fetchYears() {
      setLoading(true);
      const data = await fetchData('/years');
      const { years: validYears } = await data.json();

      setYears(validYears);
      setLoading(false);
    }

    fetchYears();
  }, []);

  useEffect(() => {
    async function fetchMakes() {
      logEvent('car_selection', {
        stage: 'year',
      });

      setLoading(true);
      const data = await fetchData('/makes', { year: selectedYear });
      const { makes: validMakes } = await data.json();

      setMakes(validMakes);
      setLoading(false);
    }

    if (selectedYear) { fetchMakes(); }
  }, [selectedYear]);

  useEffect(() => {
    async function fetchModels() {
      logEvent('car_selection', {
        stage: 'make',
      });

      setLoading(true);
      const data = await fetchData('/models', { year: selectedYear, make: selectedMake });
      const { models: validModels } = await data.json();

      setModels(validModels);
      setLoading(false);
    }

    if (selectedYear && selectedMake) { fetchModels(); }
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    async function fetchTrims() {
      logEvent('car_selection', {
        stage: 'model',
      });

      setLoading(true);
      const data = await fetchData('/model-options', { year: selectedYear, make: selectedMake, model: selectedModel });
      const { modelOptions: validTrims } = await data.json();

      setTrims(validTrims);
      setLoading(false);
    }

    if (selectedYear && selectedMake && selectedModel) { fetchTrims(); }
  }, [selectedYear, selectedMake, selectedModel]);

  useEffect(() => {
    async function fetchVehicle() {
      logEvent('car_selection', {
        stage: 'done',
      });

      setLoading(true);
      const data = await fetchData(`/vehicle/${selectedTrim.value}`);
      const vehicleData: any = await data.json();

      setVehicle(vehicleData);
      changeSetting(
        'Vehicle',
        {
          year: selectedYear,
          make: selectedMake,
          model: selectedModel,
          trimText: selectedTrim.text,
          trimValue: selectedTrim.value,
        },
        updateGlobalState,
      );
      setLoading(false);
    }

    if (selectedTrim.value) { fetchVehicle(); }
  }, [selectedTrim.value]);

  // Clear out the selected values if a previous one is cleared
  useEffect(() => {
    if (!selectedYear) {
      setSelectedMake('');
      setSelectedModel('');
      setSelectedTrim({});
      setVehicle({});
    } else if (!selectedMake) {
      setSelectedModel('');
      setSelectedTrim({});
      setVehicle({});
    } else if (!selectedModel) {
      setSelectedTrim({});
      setVehicle({});
    } else if (!selectedTrim.value) {
      setVehicle({});
    }
  }, [selectedYear, selectedMake, selectedModel, selectedTrim.value]);

  const makeRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const trimRef = useRef<TextInput>(null);

  const selectNextInput = () => {
    if (activeInput === ActiveInput.Year) {
      makeRef.current?.focus();
      setActiveInput(ActiveInput.Make);
    } else if (activeInput === ActiveInput.Make) {
      modelRef.current?.focus();
      setActiveInput(ActiveInput.Model);
    } else if (activeInput === ActiveInput.Model) {
      trimRef.current?.focus();
      setActiveInput(ActiveInput.Trim);
    } else {
      setActiveInput(ActiveInput.None);
    }
  };

  const fuelEfficiencyString = vehicle.mpg ? convertFuelEfficiencyToString(vehicle.mpg, 'US', globalState.Locale) : '';
  const cityFuelEfficiencyString = vehicle.city ? convertFuelEfficiencyToString(vehicle.city, 'US', globalState.Locale) : '';
  const highwayFuelEfficiencyString = vehicle.highway ? convertFuelEfficiencyToString(vehicle.highway, 'US', globalState.Locale) : '';

  const fuelEfficiency = vehicle.mpg ? convertFuelEfficiency(vehicle.mpg, 'US', globalState.Locale) : 1;
  const cityFuelEfficiency = vehicle.city ? convertFuelEfficiency(vehicle.city, 'US', globalState.Locale) : 1;
  const highwayFuelEfficiency = vehicle.highway ? convertFuelEfficiency(vehicle.highway, 'US', globalState.Locale) : 1;

  const tableData = vehicle.mpg
    ? [
      {
        label: 'Combined',
        text: fuelEfficiencyString,
        value: fuelEfficiency,
        key: 'Milage',
      },
      {
        label: 'City',
        text: cityFuelEfficiencyString,
        value: cityFuelEfficiency,
        key: 'City',
      },
      {
        label: 'Highway',
        text: highwayFuelEfficiencyString,
        value: highwayFuelEfficiency,
        key: 'Highway',
      },
    ]
    : [];

  const useAsFuelEfficiency = (value: number, type: string) => {
    if (value) {
      logEvent('use_as_fuel_efficiency', { type });

      changeSetting('Gas Mileage', value, updateGlobalState);
      Alert('Fuel efficiency updated', `Trips will now use ${convertFuelEfficiencyToString(value, 'CA', globalState.Locale)}.`, [
        {
          text: 'Done',
          onPress: () => navigation.navigate('Home', { screen: 'Calculate', pop: true }),
        },
      ]);
    }
  };

  const vehicleName = [selectedYear, selectedMake, selectedModel].filter(Boolean).join(' ');
  const showResult = selectedYear && selectedMake && selectedModel && selectedTrim.value;

  return (
    <Page scroll>
      <ScreenHeader
        title="Your car"
        subtitle="Look up your car’s official fuel economy and use it for trips."
      />
      <Card style={styles.form}>
        <AutocompleteInput
          label="Year"
          placeholder="e.g. 2021"
          keyboardType="number-pad"
          onPressIn={() => setActiveInput(ActiveInput.Year)}
          suggestions={(
            !loading && activeInput === ActiveInput.Year && !selectedYear
              ? years.filter((year) => year.includes(yearInput))
              : []
          )}
          suggestionsLoading={loading && activeInput === ActiveInput.Year}
          suggestionIcon="calendar-outline"
          onSuggestionPress={(newYear) => { setSelectedYear(newYear); selectNextInput(); }}
          onChangeText={setYearInput}
          value={selectedYear || yearInput}
          clearButton
          onClear={() => { setSelectedYear(''); setActiveInput(ActiveInput.Year); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!selectedYear}
          showRedundantSuggestion
          icon={<FieldIcon name="calendar-outline" />}
        />
        {!!selectedYear && (
        <AutocompleteInput
          myRef={makeRef}
          autoFocus
          label="Make"
          placeholder="e.g. Toyota"
          onPressIn={() => setActiveInput(ActiveInput.Make)}
          suggestions={(
            !loading && activeInput === ActiveInput.Make && selectedYear && !selectedMake
              ? makes.filter((make) => make.toLowerCase().includes(makeInput.toLowerCase()))
              : []
          )}
          suggestionsLoading={loading && activeInput === ActiveInput.Make}
          suggestionIcon="business-outline"
          onSuggestionPress={(newMake) => { setSelectedMake(newMake); selectNextInput(); }}
          onChangeText={setMakeInput}
          value={selectedMake || makeInput}
          clearButton
          onClear={() => { setSelectedMake(''); setActiveInput(ActiveInput.Make); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!!selectedYear && !selectedMake}
          showRedundantSuggestion
          icon={<FieldIcon name="business-outline" />}
        />
        )}
        {!!selectedYear && !!selectedMake && (
        <AutocompleteInput
          myRef={modelRef}
          autoFocus
          label="Model"
          placeholder="e.g. Corolla"
          onPressIn={() => setActiveInput(ActiveInput.Model)}
          suggestions={(
            !loading && activeInput === ActiveInput.Model && selectedMake && !selectedModel
              ? models.filter((model) => model.toLowerCase().includes(modelInput.toLowerCase()))
              : []
          )}
          suggestionsLoading={loading && activeInput === ActiveInput.Model}
          suggestionIcon="car-outline"
          onSuggestionPress={(newModel) => { setSelectedModel(newModel); selectNextInput(); }}
          onChangeText={setModelInput}
          value={selectedModel || modelInput}
          clearButton
          onClear={() => { setSelectedModel(''); setActiveInput(ActiveInput.Model); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!!selectedYear && !!selectedMake && !selectedModel}
          showRedundantSuggestion
          icon={<FieldIcon name="car-outline" />}
        />
        )}
        {!!selectedYear && !!selectedMake && !!selectedModel && (
        <AutocompleteInput
          myRef={trimRef}
          autoFocus
          label="Trim"
          placeholder="Choose a version"
          onPressIn={() => setActiveInput(ActiveInput.Trim)}
          suggestions={(
            !loading && activeInput === ActiveInput.Trim && selectedModel && !selectedTrim.text
              ? trims.map((trim) => trim.text)
                .filter((trim) => trim.toLowerCase().includes(trimInput.toLowerCase()))
              : []
          )}
          suggestionsLoading={loading && activeInput === ActiveInput.Trim}
          suggestionIcon="options-outline"
          onSuggestionPress={(newTrim) => {
            setSelectedTrim(
              trims.find((trim) => trim.text === newTrim),
            );
            selectNextInput();
          }}
          onChangeText={setTrimInput}
          value={selectedTrim.text || trimInput}
          clearButton
          onClear={() => { setSelectedTrim({}); setActiveInput(ActiveInput.Trim); }}
          blurOnSubmit={false}
          returnKeyType="done"
          editable={!!selectedYear && !!selectedMake && !!selectedModel && !selectedTrim.text}
          showRedundantSuggestion
          icon={<FieldIcon name="options-outline" />}
        />
        )}
      </Card>

      {showResult && (
        <>
          <SectionHeader title="Fuel economy" />
          <Card>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="headline" numberOfLines={1}>{vehicleName}</Text>
                <Text variant="footnote" tone="tertiary" numberOfLines={1}>{selectedTrim.text}</Text>
              </View>
              {!!vehicle.fuelType && <Badge label={vehicle.fuelType} tone="neutral" />}
            </View>
            {loading ? (
              <ActivityIndicator style={styles.loading} color={color.primaryText} />
            ) : (
              <View style={styles.tiles}>
                {tableData.length === 0 && (
                  <Text variant="subhead" tone="secondary">No fuel economy data for this trim.</Text>
                )}
                {tableData.map(({ label, text, value }) => (
                  <View key={label} style={styles.tile}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" tone="tertiary">{label}</Text>
                      <Text variant="title3">{text}</Text>
                    </View>
                    <Button
                      title="Use"
                      size="sm"
                      variant={label === 'Combined' ? 'primary' : 'secondary'}
                      accessibilityLabel={`Use ${label.toLowerCase()} fuel efficiency`}
                      onPress={() => useAsFuelEfficiency(convertFuelEfficiency(value, globalState.Locale, 'CA'), label)}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
