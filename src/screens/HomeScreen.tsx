/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Add modal for adjusting gas price manually
* Fuel Efficiency Configuration
* Highway vs City driving
*
*/

// React imports
import React, { useCallback, useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  ViewStyle,
} from 'react-native';

// External Components
import AntDesign from '@expo/vector-icons/AntDesign';
import NumericInput from 'react-native-numeric-input';

import {
  Provider, Portal, Modal,
} from 'react-native-paper';

import uuid from 'react-native-uuid';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Text from '../components/Text';
import Button from '../components/Button';
import Input from '../components/Input';

import SuggestionsSection from '../components/Home/SuggestionSection';
import StatsSection from '../components/Home/StatsSection';
import AddToFriendsTable from '../components/Home/AddToFriendTable';

// Styles
import { colors, globalStyles } from '../styles/styles';
import styles from '../styles/HomeScreen.styles';

// Mock Data
import { mockTripCost, mockSuggestions } from '../data/data';

const serverUrl = 'https://northern-bot-301518.uc.r.appspot.com';

enum ActiveInput {
  None,
  Start,
  End,
}

let sessionToken = uuid.v4();

async function fetchData(url: string, mock = false) {
  if (mock) {
    const resp = new Response();
    resp.json = () => new Promise((resolve) => {
      if (url.includes('suggestion')) {
        resolve(mockSuggestions);
      } else {
        resolve(mockTripCost);
      }
    });
    return resp;
  }
  return fetch(url);
}

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
  const [modalVisible, setModalVisible] = useState(false);

  const submit = useCallback(() => {
    Keyboard.dismiss();
    setCostRequest({
      loading: true, cost: 0, distance: 0, gasPrice: 0,
    });
    fetchData(`${serverUrl}/trip-cost/?start=${startLocation}&end=${endLocation}`, !globalState['Enable Requests'])
      .then((res) => {
        if (!res?.ok || !res) {
          Alert.alert('Error', `Request for trip cost failed (${res.status})`);
          return Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => setCostRequest({
        loading: false, cost: data.cost, distance: data.distance, gasPrice: data.gasPrice,
      }))
      .catch((err) => {
        Alert.alert('Error', err.message);
        setCostRequest({
          loading: false, cost: 0, distance: 0, gasPrice: 0,
        });
      });
  }, [startLocation, endLocation, globalState['Enable Requests']]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty then just clear the suggestions
    if (!input) {
      setSuggestions([]);
      return;
    }

    fetchData(`${serverUrl}/suggestions/?input=${input}&session=${sessionToken}`, !globalState['Enable Requests'])
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
  }, [globalState['Enable Requests']]);

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

  // Represents if the user has entered all the required data to save a trip's cost
  const canSaveTrip = !!cost && !!user;

  return (
    <Provider>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={160}
        style={styles.main}
      >
        <View style={styles.container}>
          <Text style={globalStyles.title}>⛽️ Gas Me Up 💸</Text>
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
              inputStyle={styles.numericInput as ViewStyle}
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
            clearButton
          />
          <Input
            placeholder="End location"
            onChangeText={updateEndLocation}
            onPressIn={() => changeActiveInput(ActiveInput.End)}
            value={endLocation}
            clearButton
          />
          <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation} />
          {/*
            TODO - This next section is a little messy with the `canSaveTrip` logic
            it essentially just hides the save button if the user isn't logged in
            or the trip cost hasn't been calculated yet
          */}
          <View style={canSaveTrip ? styles.buttonSection : undefined}>
            <Button style={canSaveTrip ? styles.calculateButton : undefined} onPress={submit}>
              <Text style={{ color: colors.primary }}>Calculate</Text>
            </Button>
            {canSaveTrip
              ? (
                <Button
                  style={[styles.saveButton, (canSaveTrip ? { width: '30%' } : undefined)]}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={{ color: colors.primary, marginHorizontal: 2 }}>Save</Text>
                  <AntDesign name="contacts" size={20} color={colors.primary} />
                </Button>
              ) : undefined}
          </View>
          {canSaveTrip
            ? (
              <View>
                <Portal>
                  <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={globalStyles.modal}
                  >
                    <AddToFriendsTable
                      cost={cost}
                      distance={distance}
                      gasPrice={gasPrice}
                      riders={riders}
                      closeModal={() => setModalVisible(false)}
                    />
                  </Modal>
                </Portal>
              </View>
            ) : undefined}
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
}
