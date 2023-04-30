import React from 'react';
import { View } from 'react-native';

import MapView, {
  PROVIDER_GOOGLE, Marker, Polyline, MapPressEvent, PoiClickEvent,
} from 'react-native-maps';

import { useGlobalState } from '../hooks/hooks';

import { customMapStyle } from '../helpers/mapHelper';
import { convertLocationToLatLng } from '../helpers/locationHelper';

import { colors, globalStyles } from '../styles/styles';

interface Props {
  customStart?: LatLng,
  customEnd?: LatLng,
  showUserLocation: boolean;
  waypoints: Array<Location>,
  style?: object,
  onPress?: (event: MapPressEvent) => void,
  onPoiClick?: (event: PoiClickEvent) => void,
}

export default function MapContainer({
  showUserLocation,
  waypoints,
  style,
  customStart = undefined,
  customEnd = undefined,
  onPress = (event) => console.log(event?.nativeEvent.coordinate),
  onPoiClick = (event) => console.log(event.nativeEvent.name),
}: Props) {
  const [globalState] = useGlobalState();
  const hasUserLocation = globalState.userLocation.lat && globalState.userLocation.lng;

  const fallbackStart = customStart?.lat ? customStart : undefined;
  const fallbackEnd = customEnd?.lat ? customEnd : undefined;

  const start = waypoints.length
    ? convertLocationToLatLng(waypoints[0])
    : fallbackStart;
  const end = waypoints.length
    ? convertLocationToLatLng(waypoints[waypoints.length - 1])
    : fallbackEnd;

  const hasStartAndEnd = !!start && !!end;
  const hasStartOrEnd = !!start || !!end;

  const latDelta = hasStartAndEnd ? Math.max(0.01, Math.abs(start.lat - end.lat) * 1.5) : 100;
  const lngDelta = hasStartAndEnd ? Math.max(0.01, Math.abs(start.lng - end.lng) * 1.5) : 100;

  const middleLat = hasStartAndEnd ? (start.lat + end.lat) / 2 : 0;
  const middleLng = hasStartAndEnd ? (start.lng + end.lng) / 2 : 0;

  let regionLatitude = middleLat;
  if (!middleLat) {
    regionLatitude = start?.lat || end?.lat || 0;
  }
  let regionLongitude = middleLng;
  if (!middleLng) {
    regionLongitude = start?.lng || end?.lng || 0;
  }

  const mapRegion = {
    latitude: regionLatitude,
    longitude: regionLongitude,
    latitudeDelta: hasStartOrEnd && !hasStartAndEnd ? 0.5 : latDelta,
    longitudeDelta: hasStartOrEnd && !hasStartAndEnd ? 0.5 : lngDelta,
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
        onPoiClick={onPoiClick}
      >
        {(!!start && !!start.lat && !!start.lng) && (
          <Marker
            coordinate={{
              latitude: start.lat,
              longitude: start.lng,
            }}
            title="Start"
            description="Start Location of Trip"
            pinColor={colors.action}
          />
        )}
        {(!!end && !!end.lat && !!end.lng) && (
          <Marker
            coordinate={{
              latitude: end.lat,
              longitude: end.lng,
            }}
            title="End"
            description="End Location of Trip"
            pinColor={colors.action}
          />
        )}
        {showUserLocation && hasUserLocation && (
          <Marker
            coordinate={{
              latitude: globalState.userLocation.lat,
              longitude: globalState.userLocation.lng,
            }}
            title="You"
            description="Your Current Location"
            pinColor="white"
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
  onPoiClick: undefined,
  customStart: undefined,
  customEnd: undefined,
};
