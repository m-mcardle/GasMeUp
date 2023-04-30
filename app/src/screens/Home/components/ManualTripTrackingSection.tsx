// React imports
import React from 'react';
import {
  View,
} from 'react-native';

// External Components
import { FontAwesome5 } from '@expo/vector-icons';

// Helpers
import {
  convertLatLngToLocation,
  createBackgroundLocationTask,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../../../helpers/locationHelper';
import { logEvent } from '../../../helpers/analyticsHelper';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Alert from '../../../components/Alert';

// Styles
import { colors } from '../../../styles/styles';

// Mock Data
import { fetchData } from '../../../data/data';

interface Props {
  manualTripInProgress: boolean,
  userLocation: any,
  currentRoute: any,
  setCurrentRoute: (any: any) => void,
  clearCurrentTrip: (any: any) => void,
  setPoints: (argv0: any, argv1: any) => void,
  fetchAndSetGasPrice: () => void,
  setWaypoints: (any: any) => void,
  setSuggestions: (any: any) => void,
  setLocations: (any: any) => void,
  setManualTripUsed: (any: any) => void,
  setManualTripInProgress: (any: any) => void,
  setDistanceToRouteDistance: () => void,
}

export default function ManualTripTrackingSection({
  manualTripInProgress,
  userLocation,
  currentRoute,
  setCurrentRoute,
  clearCurrentTrip,
  setPoints,
  fetchAndSetGasPrice,
  setWaypoints,
  setSuggestions,
  setLocations,
  setManualTripUsed,
  setManualTripInProgress,
  setDistanceToRouteDistance,
}: Props) {
  createBackgroundLocationTask(
    (latLng: LatLng) => setCurrentRoute((oldRoute: Array<LatLng>) => [...oldRoute, latLng]),
  );

  const startFollowingNewTrip = async () => {
    const success = await startBackgroundLocationUpdates();

    if (!success) {
      console.log('Failed to start background location updates');
      return;
    }

    logEvent('start_following_trip');

    setManualTripUsed(true);
    setManualTripInProgress(true);

    // Initialize route with user's current location to set minimum route
    setCurrentRoute([
      userLocation,
      userLocation,
    ]);

    clearCurrentTrip({ resetStart: true, resetEnd: true });
    setLocations({ startLocation: '', endLocation: '' });
    setSuggestions([]);

    fetchAndSetGasPrice();
  };

  const stopFollowingNewTrip = async () => {
    if (currentRoute.length < 2) {
      Alert('Trip too short', 'Please travel a bit further before stopping your trip');
      return;
    }

    logEvent('stop_following_trip');

    await stopBackgroundLocationUpdates();
    setManualTripInProgress(false);

    setWaypoints(currentRoute.map(convertLatLngToLocation));
    setDistanceToRouteDistance();

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

  if (manualTripInProgress) {
    return (
      <Button
        style={{ width: '60%', backgroundColor: colors.secondaryAction }}
        onPress={() => showStopTrackingAlert()}
      >
        <View style={{ flexDirection: 'row' }}>
          <FontAwesome5 name="stop-circle" size={16} color="red" />
          <Text style={{ marginLeft: 4 }}>Stop Tracking</Text>
        </View>
      </Button>
    );
  }

  return (
    <Button
      style={{ width: '60%', paddingHorizontal: 0, backgroundColor: colors.secondaryAction }}
      onPress={() => showStartTrackingAlert()}
    >
      <View style={{ flexDirection: 'row' }}>
        <FontAwesome5 name="route" size={16} color="white" />
        <Text style={{ marginLeft: 4 }}>{`Start Tracking${currentRoute.length ? ' New Trip' : ''}`}</Text>
      </View>
    </Button>
  );
}
