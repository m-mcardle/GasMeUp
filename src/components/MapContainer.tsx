import React from 'react';
import { View } from 'react-native';

import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';

import { useGlobalState } from '../hooks/hooks';

import Text from './Text';

import styles from '../styles/HomeScreen.styles';
import { globalStyles } from '../styles/styles';

import { customMapStyle } from '../helpers/mapHelper';

interface MapData {
  start: {
    lat: number;
    lng: number;
  },
  end: {
    lat: number;
    lng: number;
  }
}

interface Props {
  data: MapData;
  showUserLocation: boolean;
  waypoints: any,
}

export default function MapContainer({ data, showUserLocation, waypoints }: Props) {
  const [globalState] = useGlobalState();
  const latDelta = Math.abs(data.start.lat - data.end.lat) * 1.5;
  const lngDelta = Math.abs(data.start.lng - data.end.lng) * 1.5;

  const middleLat = (data.start.lat + data.end.lat) / 2;
  const middleLng = (data.start.lng + data.end.lng) / 2;
  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Text style={globalStyles.title}>
        Map View
      </Text>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: middleLat,
            longitude: middleLng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          customMapStyle={customMapStyle}
        >
          <Marker
            coordinate={{
              latitude: data.start.lat,
              longitude: data.start.lng,
            }}
            title="Start"
            description="Start Location of Trip"
          />
          <Marker
            coordinate={{
              latitude: data.end.lat,
              longitude: data.end.lng,
            }}
            title="End"
            description="End Location of Trip"
          />
          {showUserLocation && (
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
          <Polyline coordinates={waypoints} strokeWidth={2} strokeColor="red" />
        </MapView>
      </View>
    </View>
  );
}
