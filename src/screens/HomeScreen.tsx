/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Add modal for adjusting gas price manually
* Fuel Efficiency Configuration
* Highway vs City driving
* Add clear button to Input component
*
*/

// React imports
import React, { useCallback, useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';

// External Components
import NumericInput from 'react-native-numeric-input';

import uuid from 'react-native-uuid';

// Firebase
import { collection, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Text from '../components/Text';
import Button from '../components/Button';
import Input from '../components/Input';

import SuggestionsSection from '../components/Home/SuggestionSection';
import StatsSection from '../components/Home/StatsSection';

// Styles
import { colors } from '../styles/styles';
import styles from '../styles/HomeScreen.styles';

const serverUrl = 'https://northern-bot-301518.uc.r.appspot.com';

enum ActiveInput {
  None,
  Start,
  End,
}

let sessionToken = uuid.v4();

export default function HomeScreen() {
  const [user] = useAuthState(auth);
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.None);
  const [{
    cost,
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
  const [globalState] = useGlobalState();

  const submit = useCallback(() => {
    Keyboard.dismiss();
    setCostRequest({
      loading: true, cost: 0, distance: 0, gasPrice: 0,
    });
    fetch(`${serverUrl}/trip-cost/?start=${startLocation}&end=${endLocation}`)
      .then((res) => {
        if (!res?.ok || !res) {
          console.log(`Request for trip cost failed (${res.status})`);
          return Error(`Request failed (${res.status})`);
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

  const addToFriend = useCallback(async () => {
    await addDoc(collection(db, 'Transactions'), {
      amount: Number(cost.toFixed(2)),
      payeeUID: user?.uid ?? '',
      // TODO: Set this based on the user's friends list
      payerUID: 'UIrBmJyi31hxTEt52MkqCF7Vjgg1',
      distance,
      gasPrice,
    });
  }, [cost]);

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
      .then((data) => setSuggestions(data.suggestions ?? []))
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

    if (activeInput === ActiveInput.Start) {
      setLocations((state) => ({ ...state, startLocation: item }));
      setSuggestions([]);
    } else if (activeInput === ActiveInput.End) {
      setLocations((state) => ({ ...state, endLocation: item }));
      setSuggestions([]);
    }
  };

  const changeActiveInput = (input: ActiveInput) => {
    setSuggestions([]);
    setActiveInput(input);
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.main}>
      <View style={styles.container}>
        <Text style={styles.title}>⛽️ Gas Me Up 💸</Text>
      </View>
      <View style={styles.dataContainer}>
        <StatsSection
          loading={loading}
          cost={cost}
          riders={riders}
          distance={distance}
          gasPrice={gasPrice}
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
          onPressIn={() => changeActiveInput(ActiveInput.Start)}
          value={startLocation}
        />
        <Input
          placeholder="End location"
          onChangeText={updateEndLocation}
          onPressIn={() => changeActiveInput(ActiveInput.End)}
          value={endLocation}
        />
        <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation} />
        <Button onPress={submit} disabled={!globalState['Enable Requests']}>
          <Text style={{ color: colors.primary }}>Calculate</Text>
        </Button>
        {
          cost && user
            ? (
              <Button onPress={addToFriend}>
                <Text style={{ color: colors.primary }}>Add to Friend</Text>
              </Button>
            )
            : undefined
        }
      </View>
    </KeyboardAvoidingView>
  );
}
