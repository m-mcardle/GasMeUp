import React from 'react';
import { View } from 'react-native';

import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';

import { useGlobalState } from '../hooks/hooks';

import { customMapStyle } from '../helpers/mapHelper';
import { colors, globalStyles } from '../styles/styles';

interface Props {
  data: MapData;
  showUserLocation: boolean;
  waypoints: Array<Location>,
  style?: object,
}

export default function MapContainer({
  data, showUserLocation, waypoints, style,
}: Props) {
  const [globalState] = useGlobalState();
  const hasUserLocation = globalState.userLocation.lat && globalState.userLocation.lng;

  const latDelta = Math.abs(data.start.lat - data.end.lat) * 1.5;
  const lngDelta = Math.abs(data.start.lng - data.end.lng) * 1.5;

  const middleLat = (data.start.lat + data.end.lat) / 2;
  const middleLng = (data.start.lng + data.end.lng) / 2;

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
      >
        <Marker
          coordinate={{
            latitude: data.start.lat,
            longitude: data.start.lng,
          }}
          title="Start"
          description="Start Location of Trip"
          pinColor={colors.action}
        />
        <Marker
          coordinate={{
            latitude: data.end.lat,
            longitude: data.end.lng,
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
};
