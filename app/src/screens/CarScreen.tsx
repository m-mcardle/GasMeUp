// React imports
import React, {
  useState, useEffect, useRef,
} from 'react';
import {
  View,
  TextInput,
} from 'react-native';

import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Global State Stuff
import { useGlobalState, changeSetting } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Text from '../components/Text';

import AutocompleteInput from '../components/AutocompleteInput';

// Styles
import styles from '../styles/GasPriceScreen.styles';
import { colors } from '../styles/styles';

// Mock Data
import { fetchData } from '../data/data';
import Button from '../components/Button';

// Helpers
import { convertFuelEfficiency } from '../helpers/unitsHelper';

enum ActiveInput {
  None,
  Year,
  Make,
  Model,
  Trim,
}

export default function CarScreen() {
  const [, updateGlobalState] = useGlobalState();

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

  // Clear out the selected values if the previous one is cleared
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
        <Text>
          {`Average MPG: ${vehicle.mpg}`}
        </Text>
        <Text>
          {`City MPG: ${vehicle.city}`}
        </Text>
        <Text>
          {`Highway MPG: ${vehicle.highway}`}
        </Text>
        <Text>
          {`Fuel Type: ${vehicle.type}`}
        </Text>
        <Button
          disabled={!vehicle.mpg}
          onPress={() => changeSetting('Gas Mileage', Number(convertFuelEfficiency(Number(vehicle.mpg)).toFixed(2)), updateGlobalState)}
        >
          <Text>Use</Text>
        </Button>
      </View>
    </Page>
  );
}
