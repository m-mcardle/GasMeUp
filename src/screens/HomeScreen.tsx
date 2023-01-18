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
import Ionicons from '@expo/vector-icons/Ionicons';
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
import GasPriceModal from '../components/Home/GasPriceModal';

// Styles
import { colors, globalStyles } from '../styles/styles';
import styles from '../styles/HomeScreen.styles';

// Mock Data
import {
  mockTripCost, mockSuggestions, mockGasPrice, mockDistance,
} from '../data/data';

const serverUrl = 'https://northern-bot-301518.uc.r.appspot.com';

const FUEL_EFFICIENCY = 10;

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
      } else if (url.includes('gas')) {
        resolve(mockGasPrice);
      } else if (url.includes('distance')) {
        resolve(mockDistance);
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
    distance,
    gasPrice,
    loading,
  },
  setCostRequest] = useState<CostRequest>(
    {
      loading: false,
      distance: 0,
      gasPrice: 0,
    },
  );
  const [customGasPrice, setCustomGasPrice] = useState<number>(1.5);
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{ startLocation, endLocation }, setLocations] = useState<Locations>({ startLocation: '', endLocation: '' });
  const [riders, setRiders] = useState<number>(1);
  const [visible, setVisible] = useState<boolean>(false);
  const [useCustomGasPrice, setUseCustomGasPrice] = useState<boolean>(false);
  const [globalState] = useGlobalState();
  const [modalVisible, setModalVisible] = useState(false);

  const cost = ((distance * FUEL_EFFICIENCY) / 100) * gasPrice;

  const setGasPrice = (newPrice: number) => {
    setCostRequest((state) => ({ ...state, gasPrice: newPrice }));
  };

  const updateCustomGasPrice = (newPrice: number) => {
    setCustomGasPrice(newPrice);
    if (useCustomGasPrice) {
      setGasPrice(newPrice);
    }
  };

  const configureCustomGasPrice = (value: boolean) => {
    setUseCustomGasPrice(value);
    if (value) {
      setGasPrice(customGasPrice);
    }
  };

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    setCostRequest({
      loading: true, distance: 0, gasPrice: 0,
    });

    try {
      const distanceResponse = await fetchData(`${serverUrl}/distance/?start=${startLocation}&end=${endLocation}`, !globalState['Enable Requests']);

      if (!distanceResponse?.ok || !distanceResponse) {
        console.log(`Request for distance failed (${distanceResponse.status})`);
        return Error(`Request failed (${distanceResponse.status})`);
      }

      const { distance: newDistance } = await distanceResponse.json();
      let newGasPrice = gasPrice;

      if (!useCustomGasPrice) {
        const gasPriceResponse = await fetchData(`${serverUrl}/gas`, !globalState['Enable Requests']);

        if (!gasPriceResponse?.ok || !gasPriceResponse) {
          console.log(`Request for gas price failed (${gasPriceResponse.status})`);
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
        loading: false, distance: 0, gasPrice: 0,
      });
    }
    return null;
  }, [startLocation, endLocation, customGasPrice, gasPrice, globalState['Enable Requests']]);

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
    Keyboard.dismiss();
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
  const canSaveTrip = !!gasPrice && !!distance && !!user;

  // Represents if the user has selected a start and end location
  const canSubmit = !!startLocation && !!endLocation;

  return (
    <Provider>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={160}
        style={styles.main}
      >
        <GasPriceModal
          visible={visible}
          setVisible={setVisible}
          data={customGasPrice}
          setData={updateCustomGasPrice}
          useCustomValue={useCustomGasPrice}
          setUseCustomValue={configureCustomGasPrice}
        />
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
              start={startLocation}
              end={endLocation}
              closeModal={() => setModalVisible(false)}
            />
          </Modal>
        </Portal>
        <View style={styles.container}>
          <Text style={globalStyles.title}>⛽️ Gas Me Up 💸</Text>
        </View>
        <View style={styles.dataContainer}>
          <StatsSection
            loading={loading}
            riders={riders}
            distance={distance}
            gasPrice={gasPrice}
            useCustomGasPrice={useCustomGasPrice}
            cost={cost}
            openModal={() => setVisible(true)}
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
              editable={false}
              onChange={setRiders}
            />
          </View>
          <Input
            placeholder="Start location"
            onChangeText={updateStartLocation}
            onPressIn={() => changeActiveInput(ActiveInput.Start)}
            value={startLocation}
            icon={<Ionicons name="ios-location" size={30} color={colors.secondary} />}
            clearButton
          />
          <Input
            placeholder="End location"
            onChangeText={updateEndLocation}
            onPressIn={() => changeActiveInput(ActiveInput.End)}
            value={endLocation}
            icon={<Ionicons name="ios-location" size={30} color={colors.secondary} />}
            clearButton
          />
          <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation} />
          {/*
            TODO - This next section is a little messy with the `canSaveTrip` logic
            it essentially just hides the save button if the user isn't logged in
            or the trip cost hasn't been calculated yet
          */}
          <View style={canSaveTrip ? styles.buttonSection : undefined}>
            <Button
              disabled={!canSubmit}
              style={canSaveTrip ? styles.calculateButton : undefined}
              onPress={submit}
            >
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
              )
              : undefined}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
}
