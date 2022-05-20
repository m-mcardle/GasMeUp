// Expo imports
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';

// React imports
import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';

// External Components
import NumericInput from 'react-native-numeric-input';

// Components
import Text from './src/components/Text';
import Button from './src/components/Button';
import Input from './src/components/Input';
import SuggestionsSection from './src/components/SuggestionSelection';

// Styles
import { colors } from './src/styles/styles';

// Fonts
// @ts-ignore
import Font from './assets/fonts/Gotham-Black.otf';
// @ts-ignore
import ItalicFont from './assets/fonts/Gotham-ThinItalic.otf';

const serverUrl = 'http://carpoolcalc.loca.lt';

enum ActiveInput {
  none,
  start,
  end,
}

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: 60,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: colors.darkestGray,
  },
  costSection: {
    width: '70%',
    backgroundColor: colors.green,
    borderRadius: 5,
    margin: 10,
    padding: 5,
  },
  costText: {
    fontSize: 52,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    width: '70%',
    justifyContent: 'space-evenly',
    backgroundColor: colors.gray,
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    marginBottom: 10,
  },
  dataContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ridersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    justifyContent: 'space-around',
    backgroundColor: colors.gray,
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
  },
});

export default function App() {
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.none);
  const [{
    cost, distance, gasPrice, loading,
  }, setCostRequest] = useState<CostRequest>({
    loading: false, cost: 0, distance: 0, gasPrice: 0,
  });
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{ startLocation, endLocation }, setLocations] = useState<Locations>({ startLocation: '', endLocation: '' });
  const [riders, setRiders] = useState<number>(1);

  const submit = useCallback(() => {
    setCostRequest({
      loading: true, cost: 0, distance: 0, gasPrice: 0,
    });
    fetch(`${serverUrl}/trip-cost/?start=${startLocation}&end=${endLocation}`)
      .then((res) => {
        if (!res?.ok) {
          throw Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => setCostRequest({
        loading: false, cost: data.cost, distance: data.distance, gasPrice: data.gasPrice,
      }))
      .catch((err) => {
        Alert.alert(err);
        setCostRequest({
          loading: false, cost: 0, distance: 0, gasPrice: 0,
        });
      });
  }, [startLocation, endLocation]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty then just clear the suggestions
    if (!input) {
      setSuggestions([]);
      return;
    }

    fetch(`${serverUrl}/location/?input=${input}`)
      .then((res) => {
        if (!res?.ok) {
          throw Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => { console.log(data); setSuggestions(data.predictions); })
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
    'Gotham-Black': Font,
    'Gotham-ThinItalic': ItalicFont,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <View style={styles.container}>
        <Text style={styles.title}>CarpoolCalc</Text>
      </View>
      <View style={styles.dataContainer}>
        <View style={styles.costSection}>
          {loading
            ? <ActivityIndicator size="large" />
            : (
              <Text style={styles.costText}>
                $
                {(cost / riders).toFixed(2)}
              </Text>
            )}
        </View>
        <View style={styles.statsSection}>
          <Text>
            {distance.toFixed(2)}
            km
          </Text>
          <Text>
            $
            {gasPrice.toFixed(2)}
            /L
          </Text>
        </View>
        <View style={styles.ridersSection}>
          <Text>Riders:</Text>
          <NumericInput
            rounded
            totalHeight={30}
            totalWidth={120}
            containerStyle={{ backgroundColor: 'white' }}
            minValue={1}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.darkestGray}
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
          <Text>Calculate</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
