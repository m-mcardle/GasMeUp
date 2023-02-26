// React imports
import React, {
  useState, useEffect, useRef,
} from 'react';
import {
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
import { colors } from '../styles/styles';

function Row({
  label, text, value, useAsFuelEfficiency,
}: any) {
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
          onPress={() => useAsFuelEfficiency(value)}
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
      <DataTable.Cell numeric style={{ justifyContent: 'center' }} textStyle={{ textAlign: 'center' }}>
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

  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.None);

  const [yearInput, setYearInput] = useState('');
  const [makeInput, setMakeInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [trimInput, setTrimInput] = useState('');

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTrim, setSelectedTrim] = useState<any>({});

  const [years, setYears] = useState<Array<string>>([]);
  const [makes, setMakes] = useState<Array<string>>([]);
  const [models, setModels] = useState<Array<string>>([]);
  const [trims, setTrims] = useState<Array<any>>([]);

  const [vehicle, setVehicle] = useState<any>({});

  useEffect(() => {
    async function fetchYears() {
      const data = await fetchData('/years');
      const { years: validYears } = await data.json();

      setYears(validYears);
    }

    fetchYears();
  }, []);

  useEffect(() => {
    async function fetchMakes() {
      const data = await fetchData(`/makes?year=${selectedYear}`);
      const { makes: validMakes } = await data.json();

      setMakes(validMakes);
    }

    if (selectedYear) { fetchMakes(); }
  }, [selectedYear]);

  useEffect(() => {
    async function fetchModels() {
      const data = await fetchData(`/models?year=${selectedYear}&make=${selectedMake}`);
      const { models: validModels } = await data.json();

      setModels(validModels);
    }

    if (selectedYear && selectedMake) { fetchModels(); }
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    async function fetchTrims() {
      const data = await fetchData(`/model-options?year=${selectedYear}&make=${selectedMake}&model=${selectedModel}`);
      const { modelOptions: validTrims } = await data.json();

      setTrims(validTrims);
    }

    if (selectedYear && selectedMake && selectedModel) { fetchTrims(); }
  }, [selectedYear, selectedMake, selectedModel]);

  useEffect(() => {
    async function fetchVehicle() {
      const data = await fetchData(`/vehicle?id=${selectedTrim.value}`);
      const vehicleData: any = await data.json();

      setVehicle(vehicleData);
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
    { text: 'Use', numeric: false, style: { justifyContent: 'center', maxWidth: 64 } },
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
      navigation.navigate('Calculate');
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
    useAsFuelEfficiency,
  });

  return (
    <Page>
      <View style={styles.main}>
        <Text style={styles.title}>Car Selection</Text>
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
          }}
          onPressIn={() => setActiveInput(ActiveInput.Year)}
          onSubmitEditing={() => selectNextInput()}
          suggestions={(activeInput === ActiveInput.Year && !selectedYear
            ? years.filter((year) => year.includes(yearInput))
            : []
          )}
          onSuggestionPress={(newYear) => { setSelectedYear(newYear); selectNextInput(); }}
          placeholder="Year"
          onChangeText={setYearInput}
          value={selectedYear || yearInput}
          clearButton
          onClear={() => setSelectedYear('')}
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
            borderColor: (selectedMake ? colors.action : colors.white),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: (selectedMake ? colors.action : colors.white),
            borderWidth: 1,
            borderTopWidth: 0,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Make)}
          onSubmitEditing={() => selectNextInput()}
          suggestions={(activeInput === ActiveInput.Make && !selectedMake
            ? makes.filter((make) => make.toLowerCase().includes(makeInput.toLowerCase()))
            : []
          )}
          onSuggestionPress={(newMake) => { setSelectedMake(newMake); selectNextInput(); }}
          placeholder="Make"
          onChangeText={setMakeInput}
          value={selectedMake || makeInput}
          clearButton
          onClear={() => setSelectedMake('')}
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
            borderColor: (selectedModel ? colors.action : colors.white),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: (selectedModel ? colors.action : colors.white),
            borderWidth: 1,
            borderTopWidth: 0,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Model)}
          onSubmitEditing={() => selectNextInput()}
          suggestions={(activeInput === ActiveInput.Model && !selectedModel
            ? models.filter((model) => model.toLowerCase().includes(modelInput.toLowerCase()))
            : []
          )}
          onSuggestionPress={(newModel) => { setSelectedModel(newModel); selectNextInput(); }}
          placeholder="Model"
          onChangeText={setModelInput}
          value={selectedModel || modelInput}
          clearButton
          onClear={() => setSelectedModel('')}
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
            borderColor: (selectedTrim.text ? colors.action : colors.white),
            borderWidth: 1,
          }}
          listContainerStyle={{
            borderColor: (selectedTrim.text ? colors.action : colors.white),
            borderWidth: 1,
            borderTopWidth: 0,
          }}
          onPressIn={() => setActiveInput(ActiveInput.Trim)}
          onSubmitEditing={() => selectNextInput()}
          suggestions={(activeInput === ActiveInput.Trim && !selectedTrim.text
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
          onClear={() => setSelectedTrim({})}
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
          scrollable
        />
      </View>
    </Page>
  );
}
