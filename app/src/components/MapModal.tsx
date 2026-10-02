import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MapPressEvent, PoiClickEvent } from 'react-native-maps';

import Text from './Text';
import MapContainer from './MapContainer';

import { color, radius, space } from '../styles/theme';

interface Props {
  customStart?: LatLng,
  customEnd?: LatLng,
  showUserLocation: boolean;
  waypoints: Array<Location>,
  style?: object,
  startAddress?: string,
  endAddress?: string,
  description?: string,
  handleMapPress?: (event: MapPressEvent) => void,
  handlePoiPress?: (event: PoiClickEvent) => void,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: space.md,
  },
  endpoints: {
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  endpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  map: {
    flex: 1,
    height: undefined,
  },
});

export default function MapModal({
  showUserLocation,
  waypoints,
  style,
  customStart,
  customEnd,
  startAddress,
  endAddress,
  description,
  handleMapPress,
  handlePoiPress,
}: Props) {
  return (
    <View style={styles.container}>
      {!!description && <Text variant="footnote" tone="secondary">{description}</Text>}
      {(!!startAddress || !!endAddress) && (
        <View style={styles.endpoints}>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: color.primaryText }]} />
            <Text variant="footnote" numberOfLines={1} style={{ flex: 1 }}>{startAddress || 'Start not set'}</Text>
          </View>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: color.success }]} />
            <Text variant="footnote" numberOfLines={1} style={{ flex: 1 }}>{endAddress || 'Destination not set'}</Text>
          </View>
        </View>
      )}
      <MapContainer
        showUserLocation={showUserLocation}
        customStart={customStart}
        customEnd={customEnd}
        waypoints={waypoints}
        onPress={(event) => event && handleMapPress?.(event)}
        onPoiClick={(event) => event && handlePoiPress?.(event)}
        style={[styles.map, style]}
      />
    </View>
  );
}
