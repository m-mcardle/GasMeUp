/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Highway vs City driving
* Get user location and use that as input
*
*/

// React imports
import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Alert,
  Keyboard,
  ViewStyle,
  TextInput,
} from 'react-native';

// External Components
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import NumericInput from 'react-native-numeric-input';

import {
  Portal, Modal,
} from 'react-native-paper';

import uuid from 'react-native-uuid';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Page from '../components/Page';
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
import { fetchData } from '../data/data';

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

  const [startLocationError, setStartLocationError] = useState<boolean>(false);
  const [endLocationError, setEndLocationError] = useState<boolean>(false);

  const GAS_MILEAGE = globalState['Gas Mileage'];

  const cost = ((distance * GAS_MILEAGE) / 100) * gasPrice;

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
    if (!startLocation) {
      setStartLocationError(true);
    }
    if (!endLocation) {
      setEndLocationError(true);
    }
    if (!startLocation || !endLocation) {
      return null;
    }

    Keyboard.dismiss();
    setCostRequest({
      loading: true, distance: 0, gasPrice: 0,
    });

    try {
      const distanceResponse = await fetchData(`${serverUrl}/distance/?start=${startLocation}&end=${endLocation}`, !globalState['Enable Requests']);

      if (!distanceResponse?.ok || !distanceResponse) {
        console.log(`Request for distance failed (${distanceResponse.status})`);
        throw new Error(`Request for distance failed (${distanceResponse.status})`);
      }

      const { distance: newDistance } = await distanceResponse.json();
      let newGasPrice = gasPrice;

      if (!useCustomGasPrice) {
        const gasPriceResponse = await fetchData(`${serverUrl}/gas`, !globalState['Enable Requests']);

        if (!gasPriceResponse?.ok || !gasPriceResponse) {
          console.log(`Request for gas price failed (${gasPriceResponse.status})`);
          throw new Error(`Request for gas price failed (${gasPriceResponse.status})`);
        }

        const { price } = await gasPriceResponse.json();
        newGasPrice = price;
      }

      setStartLocationError(false);
      setEndLocationError(false);

      setCostRequest((state) => ({
        ...state,
        loading: false,
        distance: newDistance,
        gasPrice: newGasPrice,
      }));
    } catch (err: any) {
      Alert.alert(err.message);
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

  const endLocationRef = useRef<TextInput>(null);

  return (
    <Page>
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
            gasMileage={GAS_MILEAGE}
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
            inputStyle={globalStyles.numericInput as ViewStyle}
            minValue={1}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.action}
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
          error={startLocationError}
          autoComplete="street-address"
          blurOnSubmit={false}
          onSubmitEditing={() => endLocationRef.current?.focus()}
          returnKeyType="next"
        />
        <Input
          myRef={endLocationRef}
          placeholder="End location"
          onChangeText={updateEndLocation}
          onPressIn={() => changeActiveInput(ActiveInput.End)}
          value={endLocation}
          icon={<Ionicons name="ios-location" size={30} color={colors.secondary} />}
          clearButton
          error={endLocationError}
          autoComplete="street-address"
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <SuggestionsSection items={suggestions} onSelect={setInputToPickedLocation} />
        <View style={styles.buttonSection}>
          <Button
            style={styles.calculateButton}
            onPress={submit}
          >
            <Text style={{ color: colors.secondary }}>Calculate</Text>
          </Button>
          <Button
            style={styles.saveButton}
            onPress={() => setModalVisible(true)}
            disabled={!canSaveTrip}
          >
            <Text style={{ color: colors.secondary, marginHorizontal: 2 }}>Save</Text>
            <AntDesign name="contacts" size={20} color={colors.secondary} />
          </Button>
        </View>
      </View>
    </Page>
  );
}
