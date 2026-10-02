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
  StyleSheet,
  TextInput,
} from 'react-native';

// External Components
import { MapPressEvent, PoiClickEvent } from 'react-native-maps';

import { throttle, debounce } from 'throttle-debounce';
import uuid from 'react-native-uuid';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

// Helpers
import { validateCurrentUser } from '../../helpers/authHelper';
import { convertGasPrice } from '../../helpers/unitsHelper';
import {
  convertLatLngToLocation,
  CurrentRouteState,
} from '../../helpers/locationHelper';
import { logEvent } from '../../helpers/analyticsHelper';

// Global State Stuff
import { useGlobalState, changeSetting } from '../../hooks/hooks';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import MapContainer from '../../components/MapContainer';
import Modal from '../../components/Modal';
import MapModal from '../../components/MapModal';
import Alert from '../../components/Alert';
import Card from '../../components/Card';
import IconButton from '../../components/IconButton';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';

import StatsSection from './components/StatsSection';
import SettingsModal from './components/SettingsModal';
import RouteField from './components/RouteField';
import ManualTripTrackingSection from './components/ManualTripTrackingSection';

// Styles
import { color, space } from '../../styles/theme';
import { friendlyError } from '../../helpers/errorHelper';

// Mock Data
import { fetchData } from '../../data/data';
import { isFeatureEnabled } from '../../helpers/featureHelper';

const styles = StyleSheet.create({
  routeCard: {
    gap: space.sm,
  },
  connector: {
    width: 2,
    height: 14,
    marginLeft: 6,
    marginVertical: -space.xs,
    borderRadius: 1,
    backgroundColor: color.borderStrong,
  },
  section: {
    marginTop: space.lg,
  },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.danger,
  },
});

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
  const [currentCustomRoute, setCurrentCustomRoute] = useState<CurrentRouteState>({
    route: [],
    distance: 0,
  });

  const [manualTripTrackingEnabled, setManualTripTrackingEnabled] = useState<boolean>(false);

  // Set when the user commits a location (suggestion, current location, map tap); the trip is
  // recalculated once both ends are known, so there is no separate Calculate step.
  const [calculationPending, setCalculationPending] = useState<boolean>(false);

  const routeDistance = manualTripUsed ? currentCustomRoute.distance : distance;

  const GAS_MILEAGE = globalState['Gas Mileage'];

  const cost = (
    ((routeDistance * GAS_MILEAGE) / 100) // This get's the L of gas used
    * gasPrice // This gets the cost of the gas used (it should always be stored in $/L)
  );

  // Editing the price means the user wants to use it, so it switches custom pricing on.
  const updateCustomGasPrice = (newPrice: number) => {
    changeSetting('Custom Gas Price', { price: newPrice, enabled: 'true' }, updateGlobalState);
  };

  const configureCustomGasPrice = (value: boolean) => {
    logEvent('toggle_using_custom_gas_price', { value });
    changeSetting('Custom Gas Price', { price: customGasPrice, enabled: String(value) }, updateGlobalState);
  };

  const openGasModal = () => {
    logEvent('open_gas_modal');
    // Start the stepper from the live price rather than a stale custom value.
    if (!useCustomGasPrice && fetchedGasPrice) {
      changeSetting('Custom Gas Price', { price: Number(fetchedGasPrice.toFixed(2)), enabled: 'false' }, updateGlobalState);
    }
    setGasModalVisible(true);
  };

  const openFuelEfficiencyModal = () => {
    logEvent('open_fuel_efficiency_modal');
    setFuelModalVisible(true);
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

    if (!distanceResponse || !distanceResponse.ok) {
      let error = 'Unknown error occurred';
      console.log(`Request for distance failed (${distanceResponse.status})`);
      setEndLocationError(true);
      setStartLocationError(true);

      if (distanceResponse) {
        error = (await distanceResponse.json())?.error;
      }
      throw new Error(`Error: ${error}`);
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
  }, [globalState.country, globalState.region]);

  const getTripGasPrice = async () => {
    if (useCustomGasPrice) { return customGasPrice; }

    try {
      const price = await fetchGasPrice();
      return price;
    } catch (e) {
      console.log('Error fetching gas price');
      return 0;
    }
  };

  const submit = useCallback(async () => {
    logEvent('calculate_trip', {
      start: startLocation,
      end: endLocation,
    });

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
        getTripGasPrice(),
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
      console.warn(err);
      Alert('Couldn\u2019t calculate this trip', friendlyError(err, 'Check both locations and try again.'));
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

  const clearManualTrip = () => {
    setManualTripUsed(false);
    setManualTripInProgress(false);
    clearCurrentTrip({ resetStart: true, resetEnd: true });
    setLocations({ startLocation: '', endLocation: '' });
    setSuggestions([]);
    setCurrentCustomRoute({
      route: [],
      distance: 0,
    });
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
        // Suggestions are best-effort; typing a full address still works.
        console.warn(err);
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
    setStartLocationError(false);
    autocompleteSearch(input);
  };

  const updateEndLocation = (input: string) => {
    setLocations((state) => ({ ...state, endLocation: input }));
    setEndLocationError(false);
    autocompleteSearch(input);
  };

  const openMapModal = () => {
    Keyboard.dismiss();

    logEvent('open_map_modal');
    if (!manualTripUsed) { setMapModalVisible(true); }
  };

  const setInputToPickedLocation = (item: string) => {
    Keyboard.dismiss();

    logEvent('use_suggested_location', {
      input: activeInput === InputEnum.Start ? 'start' : 'end',
      suggestion: item,
    });

    // Create new session token after selecting an autocomplete result
    setSessionToken(uuid.v4() as string);

    setCalculationPending(true);
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
    const locationAvailable = !!globalState.userLocation.lat && !!globalState.userLocation.lng;

    logEvent('use_current_location', {
      input: input === InputEnum.Start ? 'start' : 'end',
      available: locationAvailable,
    });

    if (!locationAvailable) {
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
    setCalculationPending(true);
  };

  const setLocationToPressedLocation = (address: string, latitude: number, longitude: number) => {
    setCalculationPending(true);
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

    logEvent('use_pressed_location', { poi: false });

    setLocationToPressedLocation(address, latitude, longitude);
  };

  const setLocationToPressedPOI = async (event: PoiClickEvent) => {
    const coordinate = event?.nativeEvent.coordinate;
    const placeId = event?.nativeEvent.placeId;
    if (!coordinate) { return; }

    const response = await fetchData('/place', { placeId });
    const address = await response.json();

    const { latitude, longitude } = coordinate;

    logEvent('use_pressed_location', { poi: true });

    setLocationToPressedLocation(address, latitude, longitude);
  };

  useEffect(() => {
    if (!calculationPending) return;
    // Evaluate once per commit: typing in the other field must never trigger a calculation.
    setCalculationPending(false);
    const hasStart = !!startLocation || startIsCurrentLocation;
    const hasEnd = !!endLocation || endIsCurrentLocation;
    if (hasStart && hasEnd) {
      submit();
    }
  }, [calculationPending, startLocation, endLocation, usingCurrentLocation, submit]);

  // Update gas price each time the user changes custom gas price settings or fetched gas price
  useEffect(() => {
    if (!useCustomGasPrice) {
      setGasPrice(fetchedGasPrice);
    } else {
      setGasPrice(customGasPrice);
    }
  }, [useCustomGasPrice, customGasPrice, fetchedGasPrice]);

  // Initialize
  useEffect(() => {
    // Initialize user's features
    setManualTripTrackingEnabled(isFeatureEnabled('manual_trip_tracking'));

    // Fetch gas price from server (the cost card shows "—" until it arrives)
    fetchGasPrice().catch((e) => console.log('Initial gas price fetch failed', e));
  }, []);

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
        onPress: () => navigation.navigate('Friends/Login'),
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
    logEvent('open_save_trip', {
      distance,
      gas_price: gasPrice,
      logged_in: !!user,
      start_location: startPoint.address,
      end_location: endPoint.address,
      cost,
    });

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

  const routeWaypoints = manualTripInProgress
    ? currentCustomRoute.route.map(convertLatLngToLocation)
    : waypoints;

  return (
    <Page scroll>
      <SettingsModal
        setting="Gas price"
        units={globalState.Locale === 'US' ? 'Stored in $/L, shown in $/gal elsewhere' : 'Dollars per litre'}
        description="Set your own price instead of the regional average."
        visible={gasModalVisible}
        setVisible={setGasModalVisible}
        data={customGasPrice}
        setData={updateCustomGasPrice}
        useCustomValue={useCustomGasPrice}
        setUseCustomValue={configureCustomGasPrice}
      />
      <SettingsModal
        setting="Fuel efficiency"
        units="Litres per 100 km"
        description="How much fuel your car uses. Find yours on the Car tab."
        visible={fuelModalVisible}
        setVisible={setFuelModalVisible}
        data={globalState['Gas Mileage']}
        setData={(value) => changeSetting('Gas Mileage', value, updateGlobalState)}
        inputStep={0.5}
      />
      <Modal
        visible={mapModalVisible}
        title="Pick on map"
        subtitle="Tap the map to set your start, then your destination."
        tall
        onDismiss={() => setMapModalVisible(false)}
      >
        <MapModal
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

      <ScreenHeader
        eyebrow="GasMeUp"
        title="Trip cost"
        actions={(
          <IconButton
            icon="settings-outline"
            accessibilityLabel="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
        )}
      />

      {manualTripUsed ? (
        <Card style={styles.trackingCard}>
          {manualTripInProgress && <View style={styles.liveDot} />}
          <View style={{ flex: 1 }}>
            <Text variant="headline">{manualTripInProgress ? 'Tracking your trip' : 'Tracked trip'}</Text>
            <Text variant="footnote" tone="secondary" numberOfLines={2}>
              {manualTripInProgress
                ? 'Drive as normal. Stop tracking when you arrive.'
                : `${startPoint.address || 'Start'} \u2192 ${endPoint.address || 'End'}`}
            </Text>
          </View>
          {manualTripInProgress
            ? <Badge label="LIVE" tone="danger" />
            : <IconButton icon="close" accessibilityLabel="Clear tracked trip" size={32} onPress={clearManualTrip} />}
        </Card>
      ) : (
        <Card style={styles.routeCard}>
          <RouteField
            kind="start"
            placeholder="Starting point"
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
          <View style={styles.connector} />
          <RouteField
            kind="end"
            myRef={endLocationRef}
            suggestions={activeInput === InputEnum.End ? suggestions : []}
            onSuggestionPress={setInputToPickedLocation}
            placeholder="Destination"
            onChangeText={updateEndLocation}
            onPressIn={() => changeActiveInput(InputEnum.End)}
            value={endIsCurrentLocation ? 'Current Location' : endLocation}
            onClear={() => clearCurrentTrip({ resetStart: false, resetEnd: true })}
            error={endLocationError}
            onSubmitEditing={submit}
            useCurrentLocationActive={endIsCurrentLocation}
            useCurrentLocationDisabled={startIsCurrentLocation}
            onUseCurrentLocationPress={() => useCurrentLocation(InputEnum.End)}
            returnKeyType="go"
          />
        </Card>
      )}

      <View style={styles.section}>
        <StatsSection
          loading={loading}
          distance={manualTripUsed ? routeDistance : distance}
          gasPrice={gasPrice}
          useCustomGasPrice={useCustomGasPrice}
          cost={cost}
          gasMileage={GAS_MILEAGE}
          locale={globalState.Locale}
          openModal={openGasModal}
          openFuelModal={openFuelEfficiencyModal}
          canSave={canSaveTrip && !manualTripInProgress}
          onSave={handleSaveButtonPress}
        />
      </View>

      <View style={styles.section}>
        <MapContainer
          waypoints={routeWaypoints}
          showUserLocation={!startPoint.address && !endPoint.address && !manualTripInProgress}
          style={manualTripInProgress ? { borderColor: color.danger, borderWidth: 1 } : undefined}
          onPress={openMapModal}
          onPoiClick={openMapModal}
          customStart={startPoint}
          customEnd={endPoint}
          showFullscreenButton={!manualTripUsed}
        />
      </View>

      {manualTripTrackingEnabled && (
        <View style={styles.section}>
          <ManualTripTrackingSection
            currentRoute={currentCustomRoute}
            userLocation={globalState.userLocation}
            manualTripInProgress={manualTripInProgress}
            setCurrentRoute={setCurrentCustomRoute}
            clearCurrentTrip={clearCurrentTrip}
            setPoints={setPoints}
            fetchGasPrice={fetchGasPrice}
            setWaypoints={setWaypoints}
            setSuggestions={setSuggestions}
            setLocations={setLocations}
            setManualTripUsed={setManualTripUsed}
            setManualTripInProgress={setManualTripInProgress}
            setDistanceToRouteDistance={() => setDistance(routeDistance)}
          />
        </View>
      )}
    </Page>
  );
}
