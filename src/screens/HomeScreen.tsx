/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Add modal for adjusting gas price manually
* Fuel Efficiency Configuration
* Highway vs City driving
* User management / Friends
* Navigation Bar
* Add clear button to Input component
*
*/

// Expo imports
import AppLoading from 'expo-app-loading';
import {
  useFonts,
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Rubik_900Black,
  Rubik_300Light_Italic,
  Rubik_400Regular_Italic,
  Rubik_500Medium_Italic,
  Rubik_600SemiBold_Italic,
  Rubik_700Bold_Italic,
  Rubik_800ExtraBold_Italic,
  Rubik_900Black_Italic,
} from '@expo-google-fonts/rubik';

// React imports
import { useCallback, useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';

// External Components
import NumericInput from 'react-native-numeric-input';

import uuid from 'react-native-uuid';

// Components
import Text from '../components/Text';
import Button from '../components/Button';
import Input from '../components/Input';

import SuggestionsSection from '../components/Home/SuggestionSection';
import StatsSection from '../components/Home/StatsSection';
import DataModal from '../components/Home/DataModal';

// Styles
import { colors } from '../styles/styles';
import styles from '../styles/App.styles';

const serverUrl = 'http://carpoolcalc.loca.lt';

enum ActiveInput {
  none,
  start,
  end,
}

let sessionToken = uuid.v4();

export default function HomeScreen() {
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.none);
  const [{
    distance,
    gasPrice,
    loading,
  },
  setCostRequest] = useState<CostRequest>(
    {
      loading: false,
      cost: 0,
      distance: 0,
      gasPrice: 0,
    },
  );
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{ startLocation, endLocation }, setLocations] = useState<Locations>({ startLocation: '', endLocation: '' });
  const [riders, setRiders] = useState<number>(1);
  const [visible, setVisible] = useState<boolean>(false);
  const [customGasPrice, setCustomGasPrice] = useState<boolean>(false);

  const setGasPrice = (newPrice: number) => {
    setCostRequest((state) => ({ ...state, gasPrice: newPrice }));
  };

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    setCostRequest({
      loading: true, cost: 0, distance: 0, gasPrice: 0,
    });

    try {
      const distanceResponse = await fetch(`${serverUrl}/distance/?start=${startLocation}&end=${endLocation}`);

      if (!distanceResponse?.ok || !distanceResponse) {
        console.log(`Request for distance failed (${distanceResponse.status})`);
        return Error(`Request failed (${distanceResponse.status})`);
      }

      const { distance: newDistance } = await distanceResponse.json();
      let newGasPrice = gasPrice;

      if (!customGasPrice) {
        const gasPriceResponse = await fetch(`${serverUrl}/gas`);

        if (!gasPriceResponse?.ok || !gasPriceResponse) {
          console.log(`Request for distance failed (${gasPriceResponse.status})`);
          return Error(`Request failed (${gasPriceResponse.status})`);
        }

        const { price } = await gasPriceResponse.json();
        newGasPrice = price;
      }

      setCostRequest((state) => ({
        ...state,
        loading: false,
        distance: newDistance,
        gasPrice: newGasPrice,
      }));
    } catch (err: any) {
      Alert.alert(err);
      setCostRequest({
        loading: false, cost: 0, distance: 0, gasPrice: 0,
      });
    }
    return null;
  }, [startLocation, endLocation, customGasPrice, gasPrice]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty then just clear the suggestions
    if (!input) {
      setSuggestions([]);
      return;
    }

    fetch(`${serverUrl}/suggestions/?input=${input}&session=${sessionToken}`)
      .then((res) => {
        if (!res?.ok || !res) {
          console.log(`Request for suggestions failed (${res.status})`);
          return Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => setSuggestions(data.suggestions))
      .catch((err) => {
        Alert.alert(err);
      });
  }, []);

  const updateStartLocation = (input: string) => {
    setLocations((state) => ({ ...state, startLocation: input }));
    updateSuggestions(input);
  };

  const updateEndLocation = (input: string) => {
    setLocations((state) => ({ ...state, endLocation: input }));
    updateSuggestions(input);
  };

  const setInputToPickedLocation = (item: string) => {
    // Create new session token after selecting an autocomplete result
    sessionToken = uuid.v4();

    if (activeInput === ActiveInput.start) {
      setLocations((state) => ({ ...state, startLocation: item }));
      setSuggestions([]);
    } else if (activeInput === ActiveInput.end) {
      setLocations((state) => ({ ...state, endLocation: item }));
      setSuggestions([]);
    }
  };

  const changeActiveInput = (input: ActiveInput) => {
    setSuggestions([]);
    setActiveInput(input);
  };

  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
    Rubik_900Black,
    Rubik_300Light_Italic,
    Rubik_400Regular_Italic,
    Rubik_500Medium_Italic,
    Rubik_600SemiBold_Italic,
    Rubik_700Bold_Italic,
    Rubik_800ExtraBold_Italic,
    Rubik_900Black_Italic,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <DataModal
        visible={visible}
        setVisible={setVisible}
        data={gasPrice}
        setData={setGasPrice}
        useCustomValue={customGasPrice}
        setUseCustomValue={setCustomGasPrice}
      />
      <View style={styles.container}>
        <Text style={styles.title}>CarpoolCalc</Text>
      </View>
      <View style={styles.dataContainer}>
        <StatsSection
          loading={loading}
          riders={riders}
          distance={distance}
          gasPrice={gasPrice}
          openModal={() => setVisible(true)}
        />
        <View style={styles.ridersSection}>
          <Text style={styles.ridersText}>Riders:</Text>
          <NumericInput
            rounded
            totalHeight={18}
            totalWidth={120}
            containerStyle={{ backgroundColor: 'white' }}
            inputStyle={styles.numericInput}
            minValue={1}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.tertiary}
            value={riders}
            onChange={setRiders}
          />
        </View>
        <Input
          placeholder="Start location"
          onChangeText={updateStartLocation}
          onPressOut={() => changeActiveInput(ActiveInput.start)}
          value={startLocation}
        />
        <Input
          placeholder="End location"
          onChangeText={updateEndLocation}
          onPressOut={() => changeActiveInput(ActiveInput.end)}
          value={endLocation}
        />
        <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation} />
        <Button onPress={submit}>
          <Text style={{ color: colors.primary }}>Calculate</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
