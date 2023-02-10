/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Highway vs City driving
*
*/

// React imports
import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Alert,
  Keyboard,
  TextInput,
} from 'react-native';

// External Components
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

import {
  Portal,
} from 'react-native-paper';

import { throttle, debounce } from 'throttle-debounce';
import uuid from 'react-native-uuid';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Helpers
import { validateCurrentUser } from '../helpers/authHelper';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Text from '../components/Text';
import Button from '../components/Button';
import Input from '../components/Input';
import MapContainer from '../components/MapContainer';
import Modal from '../components/Modal';

import StatsSection from '../components/Home/StatsSection';
import SaveTripModal from '../components/Home/SaveTripModal';
import GasPriceModal from '../components/Home/GasPriceModal';

// Styles
import { colors } from '../styles/styles';
import styles from '../styles/HomeScreen.styles';

// Mock Data
import { fetchData } from '../data/data';

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
    start,
    end,
  },
  setCostRequest] = useState<CostRequest>(
    {
      loading: false,
      distance: 0,
      gasPrice: 0,
      start: {
        lat: 0,
        lng: 0,
        address: '',
      },
      end: {
        lat: 0,
        lng: 0,
        address: '',
      },
    },
  );
  const [waypoints, setWaypoints] = useState<any>([]);
  const [customGasPrice, setCustomGasPrice] = useState<number>(1.5);
  const [fetchedGasPrice, setFetchedGasPrice] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{ startLocation, endLocation }, setLocations] = useState<Locations>({ startLocation: '', endLocation: '' });
  const [visible, setVisible] = useState<boolean>(false);
  const [useCustomGasPrice, setUseCustomGasPrice] = useState<boolean>(false);
  const [globalState] = useGlobalState();
  const [modalVisible, setModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const [startLocationError, setStartLocationError] = useState<boolean>(false);
  const [endLocationError, setEndLocationError] = useState<boolean>(false);

  const GAS_MILEAGE = globalState['Gas Mileage'];

  const cost = (
    ((distance * GAS_MILEAGE) / 100) // This get's the L of gas used
    * gasPrice // This gets the cost of the gas used
    * (globalState.country === 'CA' ? 1 : 0.2641729) // This converts the cost based on if the gas price is $/gal or $/L
  );

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
    setSuggestions([]);
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
      loading: true,
      distance: 0,
      gasPrice: 0,
      start: { lat: 0, lng: 0, address: '' },
      end: { lat: 0, lng: 0, address: '' },
    });

    const parsedStartLocation = startLocation === 'Current Location' ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : startLocation;
    const parsedEndLocation = endLocation === 'Current Location' ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : endLocation;

    try {
      const distanceResponse = await fetchData(`/distance/?start=${parsedStartLocation}&end=${parsedEndLocation}`, !globalState['Enable Requests']);

      if (!distanceResponse?.ok || !distanceResponse) {
        console.log(`Request for distance failed (${distanceResponse.status})`);
        setEndLocationError(true);
        setStartLocationError(true);
        const { error } = await distanceResponse.json();
        throw new Error(`Error: ${error} (${distanceResponse.status})`);
      }

      const {
        distance: newDistance, start: newStart, end: newEnd, data: routeData,
      } = await distanceResponse.json();

      const { steps } = routeData.routes[0].legs[0];
      const newWaypoints = steps.map((step: any) => {
        const { lat: latitude, lng: longitude } = step.start_location;
        return {
          latitude,
          longitude,
        };
      });

      // Add the end location to the waypoints
      newWaypoints.push({
        latitude: newEnd.lat,
        longitude: newEnd.lng,
      });
      setWaypoints(newWaypoints);

      let newGasPrice = gasPrice;

      if (!useCustomGasPrice) {
        const gasPriceResponse = await fetchData(`/gas?country=${globalState.country}&region=${globalState.region}`, !globalState['Enable Requests']);

        if (!gasPriceResponse?.ok || !gasPriceResponse) {
          console.log(`Request for gas price failed (${gasPriceResponse.status})`);
          throw new Error(`Request for gas price failed (${gasPriceResponse.status})`);
        }

        const { price } = await gasPriceResponse.json();
        setFetchedGasPrice(price);
        newGasPrice = price;
      }

      setStartLocationError(false);
      setEndLocationError(false);

      setCostRequest((state) => ({
        ...state,
        loading: false,
        distance: newDistance,
        gasPrice: newGasPrice,
        start: newStart,
        end: newEnd,
      }));
    } catch (err: any) {
      Alert.alert(err.message);
      setCostRequest({
        loading: false,
        distance: 0,
        gasPrice: 0,
        start: { lat: 0, lng: 0, address: '' },
        end: { lat: 0, lng: 0, address: '' },
      });
    }
    return null;
  }, [startLocation, endLocation, useCustomGasPrice, customGasPrice, gasPrice, globalState['Enable Requests']]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty or using `Current Location` then just clear the suggestions
    if (!input || input === 'Current Location') {
      setSuggestions([]);
      return;
    }

    fetchData(`/suggestions/?input=${input}&session=${sessionToken}`, !globalState['Enable Requests'])
      .then((res) => {
        if (!res?.ok || !res) {
          console.log(`Request for suggestions failed (${res.status})`);
          return new Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch((err) => {
        Alert.alert(err);
      });
  }, [globalState['Enable Requests']]);

  const throttledUpdateSuggestions = useCallback(
    throttle(500, updateSuggestions),
    [updateSuggestions],
  );
  const debouncedUpdateSuggestions = useCallback(
    debounce(500, updateSuggestions),
    [updateSuggestions],
  );

  const autocompleteSearch = (input: string) => {
    if (input.length < 10) {
      throttledUpdateSuggestions(input);
    } else {
      debouncedUpdateSuggestions(input);
    }
  };

  const updateStartLocation = (input: string) => {
    setLocations((state) => ({ ...state, startLocation: input }));
    autocompleteSearch(input);
  };

  const updateEndLocation = (input: string) => {
    setLocations((state) => ({ ...state, endLocation: input }));
    autocompleteSearch(input);
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
    if (input === ActiveInput.Start && startLocation === 'Current Location') {
      setLocations((state) => ({ ...state, startLocation: '' }));
    } else if (input === ActiveInput.End && endLocation === 'Current Location') {
      setLocations((state) => ({ ...state, endLocation: '' }));
    }
    setActiveInput(input);
  };

  const useCurrentLocation = (input: ActiveInput) => {
    Keyboard.dismiss();

    if (input === ActiveInput.Start) {
      setLocations((state) => ({ ...state, startLocation: (state.startLocation === 'Current Location' ? '' : 'Current Location') }));
    } else {
      setLocations((state) => ({ ...state, endLocation: (state.endLocation === 'Current Location' ? '' : 'Current Location') }));
    }
    setSuggestions([]);
  };

  // Reset to last server gas price each time the use disables custom gas price
  useEffect(() => {
    if (!useCustomGasPrice) {
      setGasPrice(fetchedGasPrice);
    }
  }, [useCustomGasPrice]);

  const tripCalculated = !!distance && !!gasPrice;

  // Represents if the user has entered all the required data to save a trip's cost
  const canSaveTrip = tripCalculated && !!user;

  const endLocationRef = useRef<TextInput>(null);

  const selectNextInput = () => {
    setSuggestions([]);
    endLocationRef?.current?.focus();
  };

  console.log('Rendered', new Date().toISOString());
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
        >
          <SaveTripModal
            cost={cost}
            distance={distance}
            gasPrice={gasPrice}
            start={start.address}
            end={end.address}
            waypoints={waypoints}
            gasMileage={GAS_MILEAGE}
            closeModal={() => setModalVisible(false)}
          />
        </Modal>

        <Modal
          visible={mapModalVisible}
          onDismiss={() => setMapModalVisible(false)}
        >
          <MapContainer
            data={{
              start,
              end,
            }}
            waypoints={waypoints}
            showUserLocation={false}
          />
        </Modal>
      </Portal>
      <View style={styles.dataContainer}>
        <StatsSection
          loading={loading}
          distance={distance}
          gasPrice={gasPrice}
          useCustomGasPrice={useCustomGasPrice}
          cost={cost}
          gasMileage={GAS_MILEAGE}
          openModal={() => setVisible(true)}
        />
        <Input
          z={2}
          suggestions={activeInput === ActiveInput.Start ? suggestions : []}
          onSuggestionPress={setInputToPickedLocation}
          placeholder="Start Location"
          onChangeText={updateStartLocation}
          onPressIn={() => changeActiveInput(ActiveInput.Start)}
          value={startLocation}
          icon={(
            <MaterialIcons
              name="my-location"
              size={30}
              color={(startLocation === 'Current Location' ? colors.action : colors.secondary)}
              disabled={!globalState.userLocation.lat || !globalState.userLocation.lng || endLocation === 'Current Location'}
              onPress={() => useCurrentLocation(ActiveInput.Start)}
            />
           )}
          clearButton
          error={startLocationError}
          autoComplete="street-address"
          blurOnSubmit={false}
          onSubmitEditing={() => selectNextInput()}
          returnKeyType="next"
        />
        <Input
          myRef={endLocationRef}
          z={1}
          suggestions={activeInput === ActiveInput.End ? suggestions : []}
          onSuggestionPress={setInputToPickedLocation}
          placeholder="End Location"
          onChangeText={updateEndLocation}
          onPressIn={() => changeActiveInput(ActiveInput.End)}
          value={endLocation}
          icon={(
            <MaterialIcons
              name="my-location"
              size={30}
              color={(endLocation === 'Current Location' ? colors.action : colors.secondary)}
              disabled={!globalState.userLocation.lat || !globalState.userLocation.lng || startLocation === 'Current Location'}
              onPress={() => useCurrentLocation(ActiveInput.End)}
            />
           )}
          clearButton
          error={endLocationError}
          autoComplete="street-address"
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <View style={[styles.buttonSection, { zIndex: -1 }]}>
          <Button
            style={styles.calculateButton}
            onPress={submit}
          >
            <Text style={{ color: colors.secondary, textAlign: 'center' }}>Calculate</Text>
          </Button>
        </View>
        <View style={styles.buttonSection}>
          <Button
            style={styles.saveButton}
            onPress={() => setMapModalVisible(true)}
            disabled={!tripCalculated}
          >
            <Text
              style={styles.secondaryButtonText}
            >
              View Map
            </Text>
            <Ionicons name="map" size={12} color={colors.secondary} />
          </Button>
          <Button
            style={styles.saveButton}
            onPress={() => validateCurrentUser(user) && setModalVisible(true)}
            disabled={!canSaveTrip}
          >
            <Text
              style={styles.secondaryButtonText}
            >
              Save
            </Text>
            <AntDesign name="contacts" size={12} color={colors.secondary} />
          </Button>
        </View>
      </View>
    </Page>
  );
}
