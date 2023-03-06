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
  TouchableOpacity,
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
import { auth } from '../../../firebase';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';
import { convertGasPrice } from '../../helpers/unitsHelper';
import { getUserLocation } from '../../helpers/locationHelper';

// Global State Stuff
import { useGlobalState, changeSetting } from '../../hooks/hooks';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import Button from '../../components/Button';
import MapContainer from '../../components/MapContainer';
import Modal from '../../components/Modal';
import AutocompleteInput from '../../components/AutocompleteInput';
import MapModal from '../../components/MapModal';

import StatsSection from '../../components/Home/StatsSection';
import SettingsModal from '../../components/Home/SettingsModal';

// Styles
import { colors, globalStyles } from '../../styles/styles';
import styles from '../../styles/HomeScreen.styles';

// Mock Data
import { fetchData } from '../../data/data';

enum ActiveInput {
  None,
  Start,
  End,
}

interface Props {
  setTrip: Function,
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function HomeScreen({ navigation, setTrip }: Props) {
  const [user] = useAuthState(auth);
  const [globalState, updateGlobalState] = useGlobalState();

  const [sessionToken, setSessionToken] = useState<string>(uuid.v4() as string);
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

  const customGasPrice = globalState['Custom Gas Price'].price;
  const useCustomGasPrice = globalState['Custom Gas Price'].enabled === 'true';
  const [fetchedGasPrice, setFetchedGasPrice] = useState<number>(0);

  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const [{ startLocation, endLocation }, setLocations] = useState<Locations>({ startLocation: '', endLocation: '' });

  const [gasModalVisible, setGasModalVisible] = useState<boolean>(false);
  const [fuelModalVisible, setFuelModalVisible] = useState<boolean>(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const [startLocationError, setStartLocationError] = useState<boolean>(false);
  const [endLocationError, setEndLocationError] = useState<boolean>(false);

  const GAS_MILEAGE = globalState['Gas Mileage'];

  const cost = (
    ((distance * GAS_MILEAGE) / 100) // This get's the L of gas used
    * gasPrice // This gets the cost of the gas used (it should always be stored in $/L)
  );

  const setGasPrice = (newPrice: number) => {
    setCostRequest((state) => ({ ...state, gasPrice: newPrice }));
  };

  const updateCustomGasPrice = (newPrice: number) => {
    changeSetting('Custom Gas Price', { price: newPrice, enabled: String(useCustomGasPrice) }, updateGlobalState);
  };

  const configureCustomGasPrice = (value: boolean) => {
    changeSetting('Custom Gas Price', { price: customGasPrice, enabled: String(value) }, updateGlobalState);
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
    setCostRequest((oldState) => ({
      ...oldState,
      loading: true,
      distance: 0,
    }));

    const parsedStartLocation = startLocation === 'Current Location' ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : startLocation;
    const parsedEndLocation = endLocation === 'Current Location' ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : endLocation;

    try {
      const distanceResponse = await fetchData('/distance', { start: parsedStartLocation, end: parsedEndLocation });

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
        const gasPriceResponse = await fetchData('/gas', { country: globalState.country, region: globalState.region });

        if (!gasPriceResponse?.ok || !gasPriceResponse) {
          console.log(`Request for gas price failed (${gasPriceResponse.status})`);
          throw new Error(`Request for gas price failed (${gasPriceResponse.status})`);
        }

        const { price } = await gasPriceResponse.json();

        // Convert the gas price to $/L
        newGasPrice = convertGasPrice(price, globalState.country, 'CA');
        setFetchedGasPrice(newGasPrice);
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
      setCostRequest((oldState) => ({
        ...oldState,
        loading: false,
        distance: 0,
        start: { lat: 0, lng: 0, address: '' },
        end: { lat: 0, lng: 0, address: '' },
      }));
    }
    return null;
  }, [startLocation, endLocation, useCustomGasPrice, customGasPrice, gasPrice]);

  const updateSuggestions = useCallback((input: string) => {
    // If empty or using `Current Location` then just clear the suggestions
    if (!input || input === 'Current Location') {
      setSuggestions([]);
      return;
    }

    const location = globalState.userLocation.lat && globalState.userLocation.lng
      ? `${globalState.userLocation.lat},${globalState.userLocation.lng}`
      : undefined;
    fetchData('/suggestions', { input, location, session: sessionToken })
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
  }, []);

  const throttledUpdateSuggestions = useCallback(
    throttle(250, updateSuggestions),
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
    setSessionToken(uuid.v4() as string);

    if (activeInput === ActiveInput.Start) {
      setLocations((state) => ({ ...state, startLocation: item }));
      setSuggestions([]);
      setActiveInput(ActiveInput.End);
    } else if (activeInput === ActiveInput.End) {
      setLocations((state) => ({ ...state, endLocation: item }));
      setSuggestions([]);
      setActiveInput(ActiveInput.Start);
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

  const useCurrentLocation = async (input: ActiveInput) => {
    Keyboard.dismiss();
    await getUserLocation(updateGlobalState);

    if (input === ActiveInput.Start) {
      setLocations((state) => ({ ...state, startLocation: (state.startLocation === 'Current Location' ? '' : 'Current Location') }));
    } else {
      setLocations((state) => ({ ...state, endLocation: (state.endLocation === 'Current Location' ? '' : 'Current Location') }));
    }
    setSuggestions([]);
  };

  // Reset to last server gas price each time the user changes custom gas price settings
  useEffect(() => {
    if (!useCustomGasPrice) {
      setGasPrice(fetchedGasPrice);
    } else {
      setGasPrice(customGasPrice);
    }
  }, [useCustomGasPrice, customGasPrice]);

  // Represents if the user has entered all the required data to save a trip's cost
  const canSaveTrip = !!distance && !!gasPrice && !!cost && !!start.address && !!end.address;

  const endLocationRef = useRef<TextInput>(null);

  const selectNextInput = () => {
    setSuggestions([]);
    setActiveInput(ActiveInput.End);
    endLocationRef?.current?.focus();
  };

  const showPleaseSignInAlert = () => Alert.alert(
    'Please Sign In',
    'Sign in to your GasMeUp account to start saving your trips!',
    [
      {
        text: 'Sign In',
        onPress: () => navigation.navigate('Friends'),
        style: 'default',
      },
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ],
  );

  const handleSaveButtonPress = () => {
    if (!user) {
      showPleaseSignInAlert();
      return;
    }

    if (validateCurrentUser(user)) {
      setTrip({
        cost,
        distance,
        gasPrice,
        start: start.address,
        end: end.address,
        waypoints,
        gasMileage: GAS_MILEAGE,
      });
      navigation.navigate('Save Trip');
    }
  };

  return (
    <Page>
      <SettingsModal
        setting="Gas Price"
        units="$/L"
        visible={gasModalVisible}
        setVisible={setGasModalVisible}
        data={customGasPrice}
        setData={updateCustomGasPrice}
        useCustomValue={useCustomGasPrice}
        setUseCustomValue={configureCustomGasPrice}
        maxValue={5}
      />
      <SettingsModal
        setting="Fuel Efficiency"
        units="L/100km"
        visible={fuelModalVisible}
        setVisible={setFuelModalVisible}
        data={globalState['Gas Mileage']}
        setData={(value) => changeSetting('Gas Mileage', value, updateGlobalState)}
        inputStep={0.5}
        maxValue={40}
      />
      <Portal>
        <Modal
          visible={mapModalVisible}
          onDismiss={() => setMapModalVisible(false)}
        >
          <MapModal
            data={{
              start,
              end,
            }}
            showUserLocation={!start.address || !end.address}
            waypoints={waypoints}
          />
        </Modal>
      </Portal>
      <View style={globalStyles.headerSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.dataContainer}>
        <MapContainer
          waypoints={waypoints}
          showUserLocation={!start.address || !end.address}
          style={styles.mapView}
          onPress={() => setMapModalVisible(true)}
        />
        <StatsSection
          loading={loading}
          distance={distance}
          gasPrice={gasPrice}
          useCustomGasPrice={useCustomGasPrice}
          cost={cost}
          gasMileage={GAS_MILEAGE}
          locale={globalState.Locale}
          openModal={() => setGasModalVisible(true)}
          openFuelModal={() => setFuelModalVisible(true)}
        />
        <AutocompleteInput
          z={2}
          style={{ backgroundColor: colors.darkestGray }}
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
        <AutocompleteInput
          myRef={endLocationRef}
          z={1}
          style={{ backgroundColor: colors.darkestGray }}
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
        <View style={styles.buttonSection}>
          <Button
            style={styles.calculateButton}
            onPress={submit}
          >
            <Text style={{ color: colors.secondary, textAlign: 'center' }}>Calculate</Text>
          </Button>
          <Button
            style={styles.saveButton}
            onPress={handleSaveButtonPress}
            disabled={!canSaveTrip}
          >
            <Text
              style={styles.secondaryButtonText}
            >
              Save
            </Text>
            <AntDesign name="save" size={12} color={colors.secondary} />
          </Button>
        </View>
      </View>
    </Page>
  );
}
