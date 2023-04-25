// React imports
import React, {
  useState,
} from 'react';
import {
  View,
} from 'react-native';

// External Components
import { FontAwesome5 } from '@expo/vector-icons';

// Helpers
import {
  calculatePathLength,
  convertLatLngToLocation,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../../../helpers/locationHelper';
import { logEvent } from '../../../helpers/analyticsHelper';
import { isFeatureEnabled } from '../../../helpers/featureHelper';

// Components
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Alert from '../../../components/Alert';

// Styles
import { colors } from '../../../styles/styles';

// Mock Data
import { fetchData } from '../../../data/data';

interface Props {
  distance: number,
  fetchGasPrice: () => void,
  clearCurrentTrip: (any: any) => void,
  setDistance: (any: any) => void,
  setPoints: (argv0: any, argv1: any) => void,
  setGasPrice: (any: any) => void,
  setWaypoints: (any: any) => void,
  setSuggestions: (any: any) => void,
  setLocations: (any: any) => void,
}

export default function ManualTripTrackingSection({
  distance,
  fetchGasPrice,
  clearCurrentTrip,
  setDistance,
  setPoints,
  setGasPrice,
  setWaypoints,
  setSuggestions,
  setLocations,
}: Props) {
  const [manualTripUsed, setManualTripUsed] = useState<boolean>(false);
  const [manualTripInProgress, setManualTripInProgress] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<Array<LatLng>>([]);

  // TODO - This is inefficient because it's recalculating the entire distance every time
  const routeDistance = manualTripUsed ? calculatePathLength(currentRoute) : distance;

  const startFollowingNewTrip = async () => {
    const success = await startBackgroundLocationUpdates(
      (latLng: LatLng) => setCurrentRoute((oldRoute) => [...oldRoute, latLng]),
    );

    if (!success) {
      console.log('Failed to start background location updates');
      return;
    }

    logEvent('start_following_trip');

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

    logEvent('stop_following_trip');

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

  if (!isFeatureEnabled('manual_trip_tracking')) {
    return (
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <></>
    );
  }

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
