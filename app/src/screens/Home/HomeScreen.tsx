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
import { MapPressEvent, PoiClickEvent } from 'react-native-maps';
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

enum InputEnum {
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
  const [activeInput, setActiveInput] = useState<InputEnum>(InputEnum.None);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState<InputEnum>(InputEnum.None);
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

  const clearCurrentTrip = ({ resetStart, resetEnd } = { resetStart: false, resetEnd: false }) => {
    setWaypoints([]);
    setCostRequest((state) => ({
      ...state,
      loading: false,
      start: (resetStart ? { lat: 0, lng: 0, address: '' } : state.start),
      end: (resetEnd ? { lat: 0, lng: 0, address: '' } : state.end),
      distance: 0,
    }));

    if (resetStart && usingCurrentLocation === InputEnum.Start) {
      setUsingCurrentLocation(InputEnum.None);
    }

    if (resetEnd && usingCurrentLocation === InputEnum.End) {
      setUsingCurrentLocation(InputEnum.None);
    }
  };

  const updateTripStart = (newStart: any) => {
    setCostRequest((state) => ({
      ...state,
      start: { ...newStart },
    }));
  };

  const updateTripEnd = (newEnd: any) => {
    setCostRequest((state) => ({
      ...state,
      end: { ...newEnd },
    }));
  };

  const submit = useCallback(async () => {
    setSuggestions([]);
    const invalidStart = !startLocation && usingCurrentLocation !== InputEnum.Start;
    const invalidEnd = !endLocation && usingCurrentLocation !== InputEnum.End;
    if (invalidStart) {
      setStartLocationError(true);
    }
    if (invalidEnd) {
      setEndLocationError(true);
    }
    if (invalidStart || invalidEnd) {
      return null;
    }

    Keyboard.dismiss();
    setCostRequest((oldState) => ({
      ...oldState,
      loading: true,
      distance: 0,
    }));

    const parsedStartLocation = usingCurrentLocation === InputEnum.Start ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : startLocation;
    const parsedEndLocation = usingCurrentLocation === InputEnum.End ? `${globalState.userLocation.lat}, ${globalState.userLocation.lng}` : endLocation;

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
  }, [
    usingCurrentLocation,
    startLocation,
    endLocation,
    useCustomGasPrice,
    customGasPrice,
    gasPrice,
  ]);

  const location = (globalState.userLocation.lat && globalState.userLocation.lng
    ? `${globalState.userLocation.lat},${globalState.userLocation.lng}`
    : undefined);

  const updateSuggestions = useCallback((input: string) => {
    // If empty or using `Current Location` then just clear the suggestions
    if (!input || input === 'Current Location') {
      setSuggestions([]);
      return;
    }

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
  }, [location]);

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

    if (activeInput === InputEnum.Start) {
      setLocations((state) => ({ ...state, startLocation: item }));
      setSuggestions([]);
      setActiveInput(InputEnum.End);
    } else if (activeInput === InputEnum.End) {
      setLocations((state) => ({ ...state, endLocation: item }));
      setSuggestions([]);
      setActiveInput(InputEnum.Start);
    }
  };

  const changeActiveInput = (input: InputEnum) => {
    setSuggestions([]);
    if (input === usingCurrentLocation) {
      setUsingCurrentLocation(InputEnum.None);
    }
    setActiveInput(input);
  };

  const useCurrentLocation = async (input: InputEnum) => {
    Keyboard.dismiss();
    await getUserLocation(updateGlobalState);

    if (!globalState.userLocation.lat || !globalState.userLocation.lng) {
      Alert.alert('Location Unavailable', 'Please enable location services to use this feature');
      return;
    }

    if (input === InputEnum.Start) {
      const currentLocationAlreadySet = usingCurrentLocation === InputEnum.Start;
      updateTripStart((currentLocationAlreadySet
        ? { lat: 0, lng: 0, address: '' }
        : { lat: globalState.userLocation.lat, lng: globalState.userLocation.lng, address: 'Current Location' }
      ));
      setUsingCurrentLocation(currentLocationAlreadySet ? InputEnum.None : InputEnum.Start);
    } else {
      const currentLocationAlreadySet = usingCurrentLocation === InputEnum.End;
      updateTripEnd((currentLocationAlreadySet
        ? { lat: 0, lng: 0, address: '' }
        : { lat: globalState.userLocation.lat, lng: globalState.userLocation.lng, address: 'Current Location' }
      ));
      setUsingCurrentLocation(currentLocationAlreadySet ? InputEnum.None : InputEnum.End);
    }
    setSuggestions([]);
  };

  const setLocationToPressedLocation = (address: string, latitude: number, longitude: number) => {
    if (!startLocation && usingCurrentLocation !== InputEnum.Start) {
      // If there is no start location, set the start location to the pressed location
      clearCurrentTrip();
      updateTripStart({ lat: latitude, lng: longitude, address });
      setLocations((state) => ({ ...state, startLocation: address }));
    } else if (!endLocation && usingCurrentLocation !== InputEnum.End) {
      // If there is a start location but no end location,
      // set the end location to the pressed location
      clearCurrentTrip();
      updateTripEnd({ lat: latitude, lng: longitude, address });
      setLocations((state) => ({ ...state, endLocation: address }));
    } else {
      // If there is a start and end location, set the start location to the pressed location,
      // and clear the end location
      clearCurrentTrip({ resetStart: true, resetEnd: true });
      updateTripStart({ lat: latitude, lng: longitude, address });
      setLocations((state) => ({ ...state, startLocation: address, endLocation: '' }));
    }
  };

  const setUnknownLocationToPressedLocation = async (event: MapPressEvent) => {
    const coordinate = event?.nativeEvent.coordinate;
    if (!coordinate) { return; }

    const { latitude, longitude } = coordinate;
    const response = await fetchData('/geocode', { latlng: `${latitude},${longitude}` });
    const address = await response.json();

    setLocationToPressedLocation(address, latitude, longitude);
  };

  const setLocationToPressedPOI = async (event: PoiClickEvent) => {
    const coordinate = event?.nativeEvent.coordinate;
    const placeId = event?.nativeEvent.placeId;
    if (!coordinate) { return; }

    const response = await fetchData('/place', { placeId });
    const address = await response.json();

    const { latitude, longitude } = coordinate;
    setLocationToPressedLocation(address, latitude, longitude);
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
    setActiveInput(InputEnum.End);
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
      />
      <SettingsModal
        setting="Fuel Efficiency"
        units="L/100km"
        visible={fuelModalVisible}
        setVisible={setFuelModalVisible}
        data={globalState['Gas Mileage']}
        setData={(value) => changeSetting('Gas Mileage', value, updateGlobalState)}
        inputStep={0.5}
      />
      <Portal>
        <Modal
          visible={mapModalVisible}
          onDismiss={() => setMapModalVisible(false)}
        >
          <MapModal
            description="Tap on the map to manually set your start and end points"
            showUserLocation={!start.address || !end.address}
            waypoints={waypoints}
            handleMapPress={setUnknownLocationToPressedLocation}
            handlePoiPress={setLocationToPressedPOI}
            customStart={start}
            customEnd={end}
            startAddress={start.address}
            endAddress={end.address}
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
          showUserLocation={!start.address && !end.address}
          style={styles.mapView}
          onPress={() => { Keyboard.dismiss(); setMapModalVisible(true); }}
          onPoiClick={() => { Keyboard.dismiss(); setMapModalVisible(true); }}
          customStart={start}
          customEnd={end}
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
          suggestions={activeInput === InputEnum.Start ? suggestions : []}
          onSuggestionPress={setInputToPickedLocation}
          placeholder="Start Location"
          onChangeText={updateStartLocation}
          onPressIn={() => changeActiveInput(InputEnum.Start)}
          value={usingCurrentLocation === InputEnum.Start ? 'Current Location' : startLocation}
          icon={(
            <MaterialIcons
              name="my-location"
              size={30}
              color={(usingCurrentLocation === InputEnum.Start ? colors.action : colors.secondary)}
              disabled={usingCurrentLocation === InputEnum.End}
              onPress={() => useCurrentLocation(InputEnum.Start)}
            />
           )}
          clearButton
          onClear={() => clearCurrentTrip({ resetStart: true, resetEnd: false })}
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
          suggestions={activeInput === InputEnum.End ? suggestions : []}
          onSuggestionPress={setInputToPickedLocation}
          placeholder="End Location"
          onChangeText={updateEndLocation}
          onPressIn={() => changeActiveInput(InputEnum.End)}
          value={usingCurrentLocation === InputEnum.End ? 'Current Location' : endLocation}
          icon={(
            <MaterialIcons
              name="my-location"
              size={30}
              color={(usingCurrentLocation === InputEnum.End ? colors.action : colors.secondary)}
              disabled={usingCurrentLocation === InputEnum.Start}
              onPress={() => useCurrentLocation(InputEnum.End)}
            />
           )}
          clearButton
          onClear={() => clearCurrentTrip({ resetStart: false, resetEnd: true })}
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
