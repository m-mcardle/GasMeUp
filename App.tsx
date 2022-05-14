import AppLoading from 'expo-app-loading';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import DropDownPicker, { ItemType, ValueType } from 'react-native-dropdown-picker';

import { useFonts } from 'expo-font';

import Text from './components/Text';
import Button from './components/Button';
import Input from './components/Input';
import { colors, font, italicFont } from './styles/styles';



interface GasPrice {
  name: string,
  currency: string,
  gasoline: number
}

interface KeyValue {
  text: string,
  value: number,
}

interface TripDistance {
  distance: KeyValue,
  duration: KeyValue,
  status: string
}

interface CostRequest {
  loading: boolean,
  cost: number
}

interface Prediction {
  description: string
}

interface InputState {
  suggestions: Array<ItemType<string>>,
  startLocation: string,
  endLocation: string
}

interface Locations {
  startLocation: string,
  endLocation: string
}

enum ActiveInput {
  none,
  start,
  end
}

const serverUrl = 'http://carpoolcalc.loca.lt';

export default function App() {
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.none);
  const [pickerValue, setPickerValue] = useState<string | null>(null);
  const [{cost, loading}, setCostRequest] = useState<CostRequest>({loading: false, cost: 0});
  const [suggestions, setSuggestions] = useState<Array<ItemType<string>>>([]);
  const [{startLocation, endLocation}, setLocations] = useState<Locations>({startLocation: '', endLocation: ''});


  const submit = useCallback(() => {
    setCostRequest({loading: true, cost: 0});
    fetch(serverUrl + `/trip-cost/?start=${startLocation}&end=${endLocation}`)
      .then((res) => {
        if (!res.ok) {
          throw `Request failed (${res.status})`;
        }
        return res.json();
      })
      .then((data) => setCostRequest({loading: false, cost: data.cost}))
      .catch((err) => {
        alert(err);
        setCostRequest({loading: false, cost: 0});
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
          const suggestion: ItemType<string> = { label: el.description, value: el.description };
          return suggestion;
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

  const setInputToPickedLocation = (item: ItemType<string>) => {
    // setPickerOpen(false);
    if (activeInput === ActiveInput.start) {
      setLocations((state) => ({...state, startLocation: item.label!.toString()}))
      setSuggestions([]);
    } else if (activeInput === ActiveInput.end) {
      setLocations((state) => ({...state, endLocation: item.label!.toString()}))
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
      {/* <View style={[{height: '20%'}, styles.container]}>
        <Text style={styles.title}>CarpoolCalc</Text>
      </View> */}
      <View style={styles.container}>
        <View style={styles.costSection}>
          {loading
            ? <ActivityIndicator size={'large'}/>
            : <Text style={styles.costText}>${cost.toFixed(2)}</Text>
          }
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
        <Button onPress={submit}>
          <Text>Calculate</Text>
        </Button>
        <DropDownPicker
          open={true}
          value={pickerValue}
          items={suggestions}
          setOpen={() => {}}
          setValue={setPickerValue}
          setItems={() => {}}
          onSelectItem={setInputToPickedLocation}
          style={{display: 'none'}}
          containerStyle={{width: '70%'}}
          textStyle={{fontFamily: font}}
          ListEmptyComponent={(props) =>
            <Text style={styles.emptyList}>No suggestions</Text>
          }
        />
        {/* <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation}/> */}
      </View>
    </View>
  );
}

// function SuggestionsSection(
//   items: Array<ItemType<string>>,
//   onSelect: (arg0: string) => void
// ) {
//   return (
//     <View style={{width: '70%'}}>
//       {items?.map(el => {
//         <Text onPress={() => { onSelect(el) }}>{el}</Text>
//       })
//       ?? <Text style={styles.emptyList}>No suggestions</Text>}
//     </View>
//   )
// }

const styles = StyleSheet.create({
  title: {
    fontSize: 60
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
    fontSize: 52
  },
  picker: {
    fontFamily: font,
  },
  emptyList: {
    padding: 5,
    fontStyle: 'italic',
    fontWeight: '200',
    fontFamily: italicFont
  }
});
