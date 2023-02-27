// React imports
import React, {
  useState, useEffect, useRef,
} from 'react';
import {
  Alert,
  View,
  TextInput,
} from 'react-native';

import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import { DataTable } from 'react-native-paper';

// Global State Stuff
import { useGlobalState, changeSetting } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Text from '../components/Text';
import Button from '../components/Button';
import Table from '../components/Table';
import AutocompleteInput from '../components/AutocompleteInput';

// Mock Data
import { fetchData } from '../data/data';

// Helpers
import { convertFuelEfficiency, convertFuelEfficiencyToString } from '../helpers/unitsHelper';

// Styles
import styles from '../styles/CarScreen.styles';
import { colors, globalStyles } from '../styles/styles';

function Row({
  label, text, value, useAsFuelEfficiency, locale,
}: any) {
  const canadianFuelEfficiency = convertFuelEfficiency(value, locale, 'CA');
  return (
    <DataTable.Row
      key={text}
    >
      <DataTable.Cell>
        {label}
      </DataTable.Cell>
      <DataTable.Cell numeric>
        {text}
      </DataTable.Cell>
      <DataTable.Cell style={{ maxWidth: 64, justifyContent: 'center' }} numeric>
        <Button
          style={{ paddingHorizontal: 8, padding: 2, margin: 0 }}
          onPress={() => useAsFuelEfficiency(canadianFuelEfficiency)}
        >
          <Text>Use</Text>
        </Button>
      </DataTable.Cell>
    </DataTable.Row>
  );
}

function FooterRow({ label, text }: any) {
  return (
    <DataTable.Row
      key={text}
    >
      <DataTable.Cell>
        {label}
      </DataTable.Cell>
      <DataTable.Cell numeric>
        {' '}
      </DataTable.Cell>
      <DataTable.Cell style={{ maxWidth: 64, justifyContent: 'center' }} numeric>
        {text}
      </DataTable.Cell>
    </DataTable.Row>
  );
}

function EmptyState() {
  return (
    <Text>
      No vehicle selected
    </Text>
  );
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
      setLoading(true);
      const data = await fetchData(`/makes?year=${selectedYear}`);
      const { makes: validMakes } = await data.json();

      setMakes(validMakes);
      setLoading(false);
    }

    if (selectedYear) { fetchMakes(); }
  }, [selectedYear]);

  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      const data = await fetchData(`/models?year=${selectedYear}&make=${selectedMake}`);
      const { models: validModels } = await data.json();

      setModels(validModels);
      setLoading(false);
    }

    if (selectedYear && selectedMake) { fetchModels(); }
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    async function fetchTrims() {
      setLoading(true);
      const data = await fetchData(`/model-options?year=${selectedYear}&make=${selectedMake}&model=${selectedModel}`);
      const { modelOptions: validTrims } = await data.json();

      setTrims(validTrims);
      setLoading(false);
    }

    if (selectedYear && selectedMake && selectedModel) { fetchTrims(); }
  }, [selectedYear, selectedMake, selectedModel]);

  useEffect(() => {
    async function fetchVehicle() {
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

  const headers = [
    { text: 'Statistic', numeric: false },
    { text: 'Value', numeric: true },
    { text: 'Use', numeric: true, style: { justifyContent: 'center', maxWidth: 64 } },
  ];

  const fuelEfficiencyString = vehicle.mpg ? convertFuelEfficiencyToString(vehicle.mpg, 'US', globalState.Locale) : '';
  const cityFuelEfficiencyString = vehicle.city ? convertFuelEfficiencyToString(vehicle.city, 'US', globalState.Locale) : '';
  const highwayFuelEfficiencyString = vehicle.highway ? convertFuelEfficiencyToString(vehicle.highway, 'US', globalState.Locale) : '';

  const fuelEfficiency = vehicle.mpg ? convertFuelEfficiency(vehicle.mpg, 'US', globalState.Locale) : 1;
  const cityFuelEfficiency = vehicle.city ? convertFuelEfficiency(vehicle.city, 'US', globalState.Locale) : 1;
  const highwayFuelEfficiency = vehicle.highway ? convertFuelEfficiency(vehicle.highway, 'US', globalState.Locale) : 1;

  const tableData = vehicle.mpg
    ? [
      {
        label: 'Milage',
        text: fuelEfficiencyString,
        value: fuelEfficiency,
        key: 'Milage',
      },
      {
        label: 'Milage (City)',
        text: cityFuelEfficiencyString,
        value: cityFuelEfficiency,
        key: 'City',
      },
      {
        label: 'Milage (Highway)',
        text: highwayFuelEfficiencyString,
        value: highwayFuelEfficiency,
        key: 'Highway',
      },
    ]
    : [];

  const useAsFuelEfficiency = (value: number) => {
    if (value) {
      changeSetting('Gas Mileage', value, updateGlobalState);
      Alert.alert('Gas Mileage Updated', `Your gas milage has been updated to ${convertFuelEfficiencyToString(value, 'CA', globalState.Locale)}`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Calculate'),
        },
      ]);
    }
  };

  const MyRow = ({
    label,
    text,
    value,
  }: any) => Row({
    label,
    text,
    value,
    locale: globalState.Locale,
    useAsFuelEfficiency,
  });

  const getBorderColor = (previousInputCompleted: boolean, inputCompleted: boolean) => {
    if (previousInputCompleted && inputCompleted) {
      return colors.action;
    } if (previousInputCompleted) {
      return colors.white;
    }
    return colors.black;
  };

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Car Selection</Text>
        <Text style={globalStyles.h3}>
          Search for your car to get an accurate list of it&apos;s gas mileage
        </Text>
        <AutocompleteInput
          z={4}
          containerStyle={{
            borderColor: (selectedYear ? colors.action : colors.white),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: (selectedYear ? colors.action : colors.white),
            borderWidth: 1,
            borderTopWidth: 0,
            maxHeight: 200,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Year)}
          suggestions={(
            !loading && activeInput === ActiveInput.Year && !selectedYear
              ? years.filter((year) => year.includes(yearInput))
              : []
          )}
          onSuggestionPress={(newYear) => { setSelectedYear(newYear); selectNextInput(); }}
          placeholder="Year"
          onChangeText={setYearInput}
          value={selectedYear || yearInput}
          clearButton
          onClear={() => { setSelectedYear(''); setActiveInput(ActiveInput.Year); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!selectedYear}
          showRedundantSuggestion
          icon={(
            <Ionicons
              name="calendar"
              size={30}
              color={colors.action}
            />
           )}
        />
        <AutocompleteInput
          myRef={makeRef}
          z={3}
          containerStyle={{
            borderColor: getBorderColor(!!selectedYear, !!selectedMake),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: getBorderColor(!!selectedYear, !!selectedMake),
            borderWidth: 1,
            borderTopWidth: 0,
            maxHeight: 200,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Make)}
          suggestions={(
            !loading && activeInput === ActiveInput.Make && selectedYear && !selectedMake
              ? makes.filter((make) => make.toLowerCase().includes(makeInput.toLowerCase()))
              : []
          )}
          onSuggestionPress={(newMake) => { setSelectedMake(newMake); selectNextInput(); }}
          placeholder="Make"
          onChangeText={setMakeInput}
          value={selectedMake || makeInput}
          clearButton
          onClear={() => { setSelectedMake(''); setActiveInput(ActiveInput.Make); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!!selectedYear && !selectedMake}
          showRedundantSuggestion
          icon={(
            <FontAwesome5
              name="building"
              size={30}
              color={colors.action}
            />
           )}
        />
        <AutocompleteInput
          myRef={modelRef}
          z={2}
          containerStyle={{
            borderColor: getBorderColor(!!selectedMake, !!selectedModel),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: getBorderColor(!!selectedMake, !!selectedModel),
            borderWidth: 1,
            borderTopWidth: 0,
            maxHeight: 200,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Model)}
          suggestions={(
            !loading && activeInput === ActiveInput.Model && selectedMake && !selectedModel
              ? models.filter((model) => model.toLowerCase().includes(modelInput.toLowerCase()))
              : []
          )}
          onSuggestionPress={(newModel) => { setSelectedModel(newModel); selectNextInput(); }}
          placeholder="Model"
          onChangeText={setModelInput}
          value={selectedModel || modelInput}
          clearButton
          onClear={() => { setSelectedModel(''); setActiveInput(ActiveInput.Model); }}
          blurOnSubmit={false}
          returnKeyType="next"
          editable={!!selectedYear && !!selectedMake && !selectedModel}
          showRedundantSuggestion
          icon={(
            <Ionicons
              name="ios-car"
              size={30}
              color={colors.action}
            />
           )}
        />
        <AutocompleteInput
          myRef={trimRef}
          z={1}
          containerStyle={{
            borderColor: getBorderColor(!!selectedModel, !!selectedTrim.text),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: getBorderColor(!!selectedModel, !!selectedTrim.text),
            borderWidth: 1,
            borderTopWidth: 0,
            maxHeight: 200,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Trim)}
          suggestions={(
            !loading && activeInput === ActiveInput.Trim && selectedModel && !selectedTrim.text
              ? trims.map((trim) => trim.text)
                .filter((trim) => trim.toLowerCase().includes(trimInput.toLowerCase()))
              : []
          )}
          onSuggestionPress={(newTrim) => {
            setSelectedTrim(
              trims.find((trim) => trim.text === newTrim),
            );
            selectNextInput();
          }}
          placeholder="Trim"
          onChangeText={setTrimInput}
          value={selectedTrim.text || trimInput}
          clearButton
          onClear={() => { setSelectedTrim({}); setActiveInput(ActiveInput.Trim); }}
          blurOnSubmit={false}
          returnKeyType="done"
          editable={!!selectedYear && !!selectedMake && !!selectedModel && !selectedTrim.text}
          showRedundantSuggestion
          icon={(
            <Ionicons
              name="settings"
              size={30}
              color={colors.action}
            />
           )}
        />
        <Table
          headers={headers}
          data={tableData}
          Row={MyRow}
          EmptyState={EmptyState}
          FooterRow={(vehicle.fuelType
            ? () => FooterRow({ label: 'Fuel Type', text: vehicle.fuelType })
            : undefined
          )}
          style={{ width: '90%', marginTop: 48 }}
          loading={loading && selectedTrim.value}
          scrollable
        />
      </View>
    </Page>
  );
}
