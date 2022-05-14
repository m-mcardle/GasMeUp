import AppLoading from 'expo-app-loading';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import DropDownPicker, { ItemType, ValueType } from 'react-native-dropdown-picker';

import { useFonts } from 'expo-font';

import Text from './components/Text';
import Button from './components/Button';
import Input from './components/Input';
import { colors, font } from './styles/styles';


/*

TODO:
Fix the buggy inputs. This is unusable.

*/


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

enum ActiveInput {
  none,
  start,
  end
}

const serverUrl = 'http://carpoolcalc.loca.lt';

export default function App() {
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.none);
  const [pickerOpen, setPickerOpen] = useState<boolean>(true);
  const [pickerValue, setPickerValue] = useState<string | null>(null);
  const [{cost, loading}, setCostRequest] = useState<CostRequest>({loading: false, cost: 0});
  const [inputs, setInputs] = useState<InputState>({ suggestions: [], startLocation: '', endLocation: '' });



  const submit = useCallback(() => {
    setCostRequest({loading: true, cost: 0});
    fetch(serverUrl + `/trip-cost/?start=${inputs.startLocation}&end=${inputs.endLocation}`)
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
  }, [inputs.startLocation, inputs.endLocation]);

  const inputChanged = useCallback((input: string, isStart: boolean) => {
    // If empty then just clear the suggestions
    if (!input) {
      isStart 
        ? setInputs({ ...inputs, startLocation: input, suggestions: [] }) 
        : setInputs({ ...inputs, endLocation: input, suggestions: [] })
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
        const suggestions =  data.predictions.map((el: Prediction) =>  {
          const suggestion: ItemType<string> = { label: el.description, value: el.description };
          return suggestion;
        });
        isStart 
          ? setInputs((state) => ({ ...state, startLocation: input, suggestions: suggestions }))
          : setInputs((state) => ({ ...state, endLocation: input, suggestions: suggestions }))
      })
      .catch((err) => {
        alert(err);
      });
  }, []);

  const updateStartLocation = (input: string) => {
    setInputs((state) => ({ ...state, startLocation: input }))
    inputChanged(input, true);
  }

  const updateEndLocation = (input: string) => {
    setInputs((state) => ({ ...state, endLocation: input }))
    inputChanged(input, false);
  }

  const setInputToPickedLocation = (item: ItemType<string>) => {
    setPickerOpen(false);
    if (activeInput === ActiveInput.start) {
      setInputs((state) => ({...state, startLocation: item.label!.toString(), suggestions: []}))
    } else if (activeInput === ActiveInput.end) {
      setInputs((state) => ({...state, endLocation: item.label!.toString(), suggestions: []}))
    }
  }

  useEffect(() => {
    if (activeInput !== ActiveInput.none && !pickerOpen) {
      setPickerOpen(true);
    }
  }, [activeInput])
  

  let [fontsLoaded] = useFonts({
    'Gotham-Black': require('./assets/fonts/Gotham-Black.otf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.costSection}>
        {loading
          ? <ActivityIndicator />
          : <Text style={styles.costText}>${cost.toFixed(2)}</Text>
        }
      </View>
      <Input
        placeholder='Start location'
        onChangeText={updateStartLocation}
        onPressOut={() => setActiveInput(ActiveInput.start)}
        value={inputs?.startLocation}
      />
      <Input
        placeholder='End location'
        onChangeText={updateEndLocation}
        onPressOut={() => setActiveInput(ActiveInput.end)}
        value={inputs?.endLocation}
      />
      <Button onPress={submit}>
        <Text>Calculate</Text>
      </Button>
      <DropDownPicker
        open={pickerOpen}
        value={pickerValue}
        items={inputs.suggestions}
        setOpen={() => {}}
        setValue={setPickerValue}
        setItems={() => {}}
        onSelectItem={setInputToPickedLocation}
        style={{display: 'none'}}
        containerStyle={{width: '70%'}}
        textStyle={{fontFamily: font}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkestGray,
    alignItems: 'center',
    justifyContent: 'center',
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
  }
});
