// Expo imports
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';

// React imports
import { useCallback, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

// Components
import Text from './components/Text';
import Button from './components/Button';
import Input from './components/Input';
import SuggestionsSection from './components/SuggestionSelection';

// Styles
import { colors } from './styles/styles';


enum ActiveInput {
  none,
  start,
  end
}

const serverUrl = 'http://carpoolcalc.loca.lt';

export default function App() {
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.none);
  const [{cost, distance, gasPrice, loading}, setCostRequest] = useState<CostRequest>({loading: false, cost: 0, distance: 0, gasPrice: 0});
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{startLocation, endLocation}, setLocations] = useState<Locations>({startLocation: '', endLocation: ''});


  const submit = useCallback(() => {
    setCostRequest({loading: true, cost: 0, distance: 0, gasPrice: 0});
    fetch(serverUrl + `/trip-cost/?start=${startLocation}&end=${endLocation}`)
      .then((res) => {
        if (!res.ok) {
          throw `Request failed (${res.status})`;
        }
        return res.json();
      })
      .then((data) => setCostRequest({loading: false, cost: data.cost, distance: data.distance, gasPrice: data.gasPrice}))
      .catch((err) => {
        alert(err);
        setCostRequest({loading: false, cost: 0, distance: 0, gasPrice: 0});
      });
  }, [startLocation, endLocation]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty then just clear the suggestions
    if (!input) {
      setSuggestions([]);
      return;
    }

    fetch(serverUrl + `/location/?input=${input}`)
      .then((res) => {
        if (!res.ok) {
          throw `Request failed (${res.status})`;
        }
        return res.json();
      })
      .then((data) => {
        const newSuggestions =  data.predictions.map((el: Prediction) =>  {
          return el.description;
        });

        setSuggestions(newSuggestions);
      })
      .catch((err) => {
        alert(err);
      });
  }, []);

  const updateStartLocation = (input: string) => {
    setLocations((state) => ({ ...state, startLocation: input }))
    updateSuggestions(input);
  }

  const updateEndLocation = (input: string) => {
    setLocations((state) => ({ ...state, endLocation: input }))
    updateSuggestions(input);
  }

  const setInputToPickedLocation = (item: string) => {
    if (activeInput === ActiveInput.start) {
      setLocations((state) => ({...state, startLocation: item}))
      setSuggestions([]);
    } else if (activeInput === ActiveInput.end) {
      setLocations((state) => ({...state, endLocation: item}))
      setSuggestions([]);
    }
  }

  const changeActiveInput = (input: ActiveInput) => {
    setSuggestions([]);
    setActiveInput(input);
  }

  let [fontsLoaded] = useFonts({
    'Gotham-Black': require('./assets/fonts/Gotham-Black.otf'),
    'Gotham-ThinItalic': require('./assets/fonts/Gotham-ThinItalic.otf')
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.main}>
      <View style={styles.container}>
        <Text style={styles.title}>CarpoolCalc</Text>
      </View>
      <View style={styles.dataContainer}>
        <View style={styles.costSection}>
          {loading
            ? <ActivityIndicator size={'large'}/>
            : <Text style={styles.costText}>${cost.toFixed(2)}</Text>
          }
        </View>
        <View style={styles.statsSection}>
          <Text>{distance.toFixed(2)}km</Text>
          <Text>${gasPrice.toFixed(2)}/L</Text>
        </View>
        <Input
          placeholder='Start location'
          onChangeText={updateStartLocation}
          onPressOut={() => changeActiveInput(ActiveInput.start)}
          value={startLocation}
        />
        <Input
          placeholder='End location'
          onChangeText={updateEndLocation}
          onPressOut={() => changeActiveInput(ActiveInput.end)}
          value={endLocation}
        />
        <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation}/>
        <Button onPress={submit}>
          <Text>Calculate</Text>
        </Button>
      </View>
    </View>
  );
}


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
    textAlign: 'center'
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
  }
});
