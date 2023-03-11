// React imports
import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from 'react-native';

// External Components
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
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
import {
  calculatePathLength,
  convertLatLngToLocation,
  createBackgroundLocationTask,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../../helpers/locationHelper';

// Global State Stuff
import { useGlobalState, changeSetting } from '../../hooks/hooks';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import Button from '../../components/Button';
import MapContainer from '../../components/MapContainer';
import Modal from '../../components/Modal';
import MapModal from '../../components/MapModal';
import Alert from '../../components/Alert';

import StatsSection from '../../components/Home/StatsSection';
import SettingsModal from '../../components/Home/SettingsModal';
import SaveTripButton from '../../components/Home/SaveTripButton';
import CalculateButton from '../../components/Home/CalculateButton';
import LocationInput from '../../components/Home/LocationInput';

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
  const startIsCurrentLocation = usingCurrentLocation === InputEnum.Start;
  const endIsCurrentLocation = usingCurrentLocation === InputEnum.End;
  const [{
    distance,
    gasPrice,
    loading,
    startPoint,
    endPoint,
  },
  setCostRequest] = useState<CostRequest>(
    {
      loading: false,
      distance: 0,
      gasPrice: 0,
      startPoint: {
        lat: 0,
        lng: 0,
        address: '',
      },
      endPoint: {
        lat: 0,
        lng: 0,
        address: '',
      },
    },
  );
  const setDistance = (d: number) => setCostRequest(
    (state) => ({ ...state, distance: d }),
  );
  const setPoints = (s: Point, e: Point) => setCostRequest(
    (state) => ({ ...state, startPoint: s, endPoint: e }),
  );
  const setGasPrice = (newPrice: number) => setCostRequest(
    (state) => ({ ...state, gasPrice: newPrice }),
  );
  const [waypoints, setWaypoints] = useState<Array<Location>>([]);

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

  const [manualTripUsed, setManualTripUsed] = useState<boolean>(false);
  const [manualTripInProgress, setManualTripInProgress] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<Array<LatLng>>([]);

  // TODO - This is inefficient because it's recalculating the entire distance every time
  const routeDistance = manualTripUsed ? calculatePathLength(currentRoute) : distance;

  const GAS_MILEAGE = globalState['Gas Mileage'];

  const cost = (
    ((routeDistance * GAS_MILEAGE) / 100) // This get's the L of gas used
    * gasPrice // This gets the cost of the gas used (it should always be stored in $/L)
  );

  // Instantiate the background location task
  createBackgroundLocationTask(
    (latLng: LatLng) => setCurrentRoute((oldRoute) => [...oldRoute, latLng]),
  );

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
      startPoint: (resetStart ? { lat: 0, lng: 0, address: '' } : state.startPoint),
      endPoint: (resetEnd ? { lat: 0, lng: 0, address: '' } : state.endPoint),
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
      startPoint: { ...newStart },
    }));
  };

  const updateTripEnd = (newEnd: any) => {
    setCostRequest((state) => ({
      ...state,
      endPoint: { ...newEnd },
    }));
  };

  const fetchDistance = useCallback(async (start: string, end: string) => {
    const distanceResponse = await fetchData('/distance', { start, end });

    if (!distanceResponse?.ok || !distanceResponse) {
      console.log(`Request for distance failed (${distanceResponse.status})`);
      setEndLocationError(true);
      setStartLocationError(true);
      const { error } = await distanceResponse.json();
      throw new Error(`Error: ${error} (${distanceResponse.status})`);
    }

    const {
      distance: tripDistance, start: tripStart, end: tripEnd, data: routeData,
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
      latitude: tripEnd.lat,
      longitude: tripEnd.lng,
    });
    setWaypoints(newWaypoints);

    return {
      distance: tripDistance,
      start: tripStart,
      end: tripEnd,
    };
  }, []);

  const fetchGasPrice = useCallback(async () => {
    if (useCustomGasPrice) { return customGasPrice; }

    const gasPriceResponse = await fetchData('/gas', { country: globalState.country, region: globalState.region });

    if (!gasPriceResponse?.ok || !gasPriceResponse) {
      console.log(`Request for gas price failed (${gasPriceResponse.status})`);
      throw new Error(`Request for gas price failed (${gasPriceResponse.status})`);
    }

    const { price } = await gasPriceResponse.json();

    // Convert the gas price to $/L
    const tripGasPrice = convertGasPrice(price, globalState.country, 'CA');
    setFetchedGasPrice(tripGasPrice);
    return tripGasPrice;
  }, [globalState.country, globalState.region, customGasPrice, useCustomGasPrice]);

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
      const [
        { distance: tripDistance, start: tripStart, end: tripEnd },
        tripGasPrice,
      ] = await Promise.all([
        fetchDistance(parsedStartLocation, parsedEndLocation),
        fetchGasPrice(),
      ]);

      setStartLocationError(false);
      setEndLocationError(false);

      setCostRequest((state) => ({
        ...state,
        loading: false,
        distance: tripDistance,
        gasPrice: tripGasPrice,
        startPoint: tripStart,
        endPoint: tripEnd,
      }));
    } catch (err: any) {
      Alert(err.message);
      setCostRequest((oldState) => ({
        ...oldState,
        loading: false,
        distance: 0,
        startPoint: { lat: 0, lng: 0, address: '' },
        endPoint: { lat: 0, lng: 0, address: '' },
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

  const startFollowingNewTrip = async () => {
    const success = await startBackgroundLocationUpdates();

    if (!success) {
      console.log('Failed to start background location updates');
      return;
    }

    setManualTripUsed(true);
    setManualTripInProgress(true);
    setCurrentRoute([]);
    clearCurrentTrip({ resetStart: true, resetEnd: true });
    setLocations({ startLocation: '', endLocation: '' });
    setSuggestions([]);

    const tripGasPrice = await fetchGasPrice();
    setGasPrice(tripGasPrice);
  };

  const stopFollowingNewTrip = async () => {
    if (currentRoute.length < 2) {
      Alert('Trip too short', 'Please travel a bit further before stopping your trip');
      return;
    }

    await stopBackgroundLocationUpdates();
    setManualTripInProgress(false);

    setWaypoints(currentRoute.map(convertLatLngToLocation));
    setDistance(routeDistance);

    const routeStart = currentRoute[0];
    const routeEnd = currentRoute[currentRoute.length - 1];

    const startResponse = await fetchData('/geocode', { latlng: `${routeStart.lat},${routeStart.lng}` });
    const startAddress = await startResponse.json();

    const endResponse = await fetchData('/geocode', { latlng: `${routeEnd.lat},${routeEnd.lng}` });
    const endAddress = await endResponse.json();

    const tripStart = { lat: routeStart.lat, lng: routeStart.lng, address: startAddress };
    const tripEnd = { lat: routeEnd.lat, lng: routeEnd.lng, address: endAddress };

    setPoints(tripStart, tripEnd);
    setLocations({ startLocation: tripStart.address, endLocation: tripEnd.address });
  };

  const clearManualTrip = () => {
    setManualTripUsed(false);
    setManualTripInProgress(false);
    clearCurrentTrip({ resetStart: true, resetEnd: true });
    setLocations({ startLocation: '', endLocation: '' });
    setSuggestions([]);
    setCurrentRoute([]);
  };

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
        Alert(err);
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

  const handleMapPress = () => {
    Keyboard.dismiss();
    if (!manualTripUsed) { setMapModalVisible(true); }
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

    if (!globalState.userLocation.lat || !globalState.userLocation.lng) {
      Alert('Location Unavailable', 'Please enable location services to use this feature');
      return;
    }

    if (input === InputEnum.Start) {
      const currentLocationAlreadySet = startIsCurrentLocation;
      updateTripStart((currentLocationAlreadySet
        ? { lat: 0, lng: 0, address: '' }
        : { lat: globalState.userLocation.lat, lng: globalState.userLocation.lng, address: 'Current Location' }
      ));
      setUsingCurrentLocation(currentLocationAlreadySet ? InputEnum.None : InputEnum.Start);
    } else {
      const currentLocationAlreadySet = endIsCurrentLocation;
      updateTripEnd((currentLocationAlreadySet
        ? { lat: 0, lng: 0, address: '' }
        : { lat: globalState.userLocation.lat, lng: globalState.userLocation.lng, address: 'Current Location' }
      ));
      setUsingCurrentLocation(currentLocationAlreadySet ? InputEnum.None : InputEnum.End);
    }
    setSuggestions([]);
  };

  const setLocationToPressedLocation = (address: string, latitude: number, longitude: number) => {
    if (!startLocation && !startIsCurrentLocation) {
      // If there is no start location, set the start location to the pressed location
      clearCurrentTrip();
      updateTripStart({ lat: latitude, lng: longitude, address });
      setLocations((state) => ({ ...state, startLocation: address }));
    } else if (!endLocation && !endIsCurrentLocation) {
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
      setLocations({ startLocation: address, endLocation: '' });
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
  const canSaveTrip = (
    !!distance
    && !!gasPrice
    && !!cost
    && !!startPoint.address
    && !!endPoint.address
  );

  const endLocationRef = useRef<TextInput>(null);

  const selectNextInput = () => {
    setSuggestions([]);
    setActiveInput(InputEnum.End);
    endLocationRef?.current?.focus();
  };

  const showPleaseSignInAlert = () => Alert(
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

  const showStartTrackingAlert = () => Alert(
    'Start Trip',
    'GasMeUp will start following your location and recording your trip. You can stop tracking at any time. Are you sure you want to start a new trip?',
    [
      {
        text: 'Start',
        onPress: () => startFollowingNewTrip(),
        style: 'default',
      },
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
    ],
  );

  const showStopTrackingAlert = () => Alert(
    'End Trip',
    'Are you sure you want to stop tracking your location? This will finish your trip and you cannot undo this action.',
    [
      {
        text: 'Finish',
        onPress: () => stopFollowingNewTrip(),
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
        start: startPoint.address,
        end: endPoint.address,
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
            showUserLocation={!startPoint.address || !endPoint.address}
            waypoints={waypoints}
            handleMapPress={setUnknownLocationToPressedLocation}
            handlePoiPress={setLocationToPressedPOI}
            customStart={startPoint}
            customEnd={endPoint}
            startAddress={startPoint.address}
            endAddress={endPoint.address}
          />
        </Modal>
      </Portal>
      <View style={{ ...globalStyles.headerSection, top: 24 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.dataContainer}>
        <MapContainer
          waypoints={manualTripInProgress ? currentRoute.map(convertLatLngToLocation) : waypoints}
          showUserLocation={!startPoint.address && !endPoint.address && !manualTripInProgress}
          style={{ ...styles.mapView, borderColor: manualTripInProgress ? 'red' : 'white' }}
          onPress={handleMapPress}
          onPoiClick={handleMapPress}
          customStart={startPoint}
          customEnd={endPoint}
        />
        <StatsSection
          loading={loading}
          distance={manualTripUsed ? routeDistance : distance}
          gasPrice={gasPrice}
          useCustomGasPrice={useCustomGasPrice}
          cost={cost}
          gasMileage={GAS_MILEAGE}
          locale={globalState.Locale}
          openModal={() => setGasModalVisible(true)}
          openFuelModal={() => setFuelModalVisible(true)}
        />
        {!manualTripUsed && (
        <>
          <LocationInput
            z={2}
            placeholder="Start Location"
            suggestions={activeInput === InputEnum.Start ? suggestions : []}
            onSuggestionPress={setInputToPickedLocation}
            onChangeText={updateStartLocation}
            onPressIn={() => changeActiveInput(InputEnum.Start)}
            value={startIsCurrentLocation ? 'Current Location' : startLocation}
            useCurrentLocationActive={startIsCurrentLocation}
            useCurrentLocationDisabled={endIsCurrentLocation}
            onUseCurrentLocationPress={() => useCurrentLocation(InputEnum.Start)}
            onClear={() => clearCurrentTrip({ resetStart: true, resetEnd: false })}
            error={startLocationError}
            onSubmitEditing={() => selectNextInput()}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <LocationInput
            myRef={endLocationRef}
            z={1}
            suggestions={activeInput === InputEnum.End ? suggestions : []}
            onSuggestionPress={setInputToPickedLocation}
            placeholder="End Location"
            onChangeText={updateEndLocation}
            onPressIn={() => changeActiveInput(InputEnum.End)}
            value={endIsCurrentLocation ? 'Current Location' : endLocation}
            onClear={() => clearCurrentTrip({ resetStart: false, resetEnd: true })}
            error={endLocationError}
            onSubmitEditing={submit}
            useCurrentLocationActive={endIsCurrentLocation}
            useCurrentLocationDisabled={startIsCurrentLocation}
            onUseCurrentLocationPress={() => useCurrentLocation(InputEnum.End)}
            returnKeyType="done"
          />
          <View>
            <Text style={{ marginTop: 8 }}>- OR -</Text>
          </View>
        </>
        )}
        {manualTripInProgress ? (
          <Button
            style={{ width: '60%', backgroundColor: colors.secondaryAction }}
            onPress={() => showStopTrackingAlert()}
          >
            <View style={{ flexDirection: 'row' }}>
              <FontAwesome5 name="stop-circle" size={16} color="red" />
              <Text style={{ marginLeft: 4 }}>Stop Tracking</Text>
            </View>
          </Button>
        ) : (
          <Button
            style={{ width: '60%', paddingHorizontal: 0, backgroundColor: colors.secondaryAction }}
            onPress={() => showStartTrackingAlert()}
          >
            <View style={{ flexDirection: 'row' }}>
              <FontAwesome5 name="route" size={16} color="white" />
              <Text style={{ marginLeft: 4 }}>{`Start Tracking${currentRoute.length ? ' New Trip' : ''}`}</Text>
            </View>
          </Button>
        )}
        <View style={styles.buttonSection}>
          {manualTripUsed ? (
            <Button
              style={{ ...styles.calculateButton, backgroundColor: colors.red }}
              onPress={clearManualTrip}
              disabled={manualTripInProgress}
            >
              <Ionicons name="ios-close" size={12} color="white" />
              <Text>Clear Trip</Text>
            </Button>
          ) : (
            <CalculateButton
              onPress={submit}
              disabled={manualTripInProgress}
            />
          )}
          <SaveTripButton
            onPress={handleSaveButtonPress}
            canSaveTrip={canSaveTrip}
          />
        </View>
      </View>
    </Page>
  );
}
