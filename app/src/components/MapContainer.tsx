import React from 'react';
import { View } from 'react-native';

import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';

import { useGlobalState } from '../hooks/hooks';

import { customMapStyle, locationToLatLng } from '../helpers/mapHelper';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  showUserLocation: boolean;
  waypoints: Array<Location>,
  style?: object,
  onPress?: () => void,
}

export default function MapContainer({
  showUserLocation, waypoints, style, onPress,
}: Props) {
  const [globalState] = useGlobalState();
  const hasUserLocation = globalState.userLocation.lat && globalState.userLocation.lng;

  const start = waypoints.length
    ? locationToLatLng(waypoints[0])
    : { lat: 0, lng: 0 };
  const end = waypoints.length
    ? locationToLatLng(waypoints[waypoints.length - 1])
    : { lat: 0, lng: 0 };

  const latDelta = Math.abs(start.lat - end.lat) * 1.5 ?? 5;
  const lngDelta = Math.abs(start.lng - end.lng) * 1.5 ?? 5;

  const middleLat = (start.lat + end.lat) / 2;
  const middleLng = (start.lng + end.lng) / 2;

  const mapRegion = {
    latitude: middleLat,
    longitude: middleLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };

  const userLocationRegion = {
    latitude: globalState.userLocation.lat,
    longitude: globalState.userLocation.lng,
    latitudeDelta: 1,
    longitudeDelta: 1,
  };

  const fallbackToUserRegion = (
    hasUserLocation && showUserLocation && mapRegion.latitude === 0 && mapRegion.longitude === 0
  );

  return (
    <View style={[globalStyles.mapContainer, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={globalStyles.map}
        region={fallbackToUserRegion ? userLocationRegion : mapRegion}
        customMapStyle={customMapStyle}
        onPress={onPress}
      >
        <Marker
          coordinate={{
            latitude: start.lat,
            longitude: start.lng,
          }}
          title="Start"
          description="Start Location of Trip"
          pinColor={colors.action}
        />
        <Marker
          coordinate={{
            latitude: end.lat,
            longitude: end.lng,
          }}
          title="End"
          description="End Location of Trip"
          pinColor={colors.action}
        />
        {showUserLocation && hasUserLocation && (
          <Marker
            coordinate={{
              latitude: globalState.userLocation.lat,
              longitude: globalState.userLocation.lng,
            }}
            title="You"
            description="Your Current Location"
            pinColor="blue"
          />
        )}
        {waypoints.length > 0 && (
          <Polyline coordinates={waypoints} strokeWidth={2} strokeColor={colors.action} />
        )}
      </MapView>
    </View>
  );
}

MapContainer.defaultProps = {
  style: undefined,
  onPress: undefined,
};
