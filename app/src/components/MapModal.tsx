import React from 'react';
import { View } from 'react-native';

import { MapPressEvent, PoiClickEvent } from 'react-native-maps';

import Text from './Text';
import MapContainer from './MapContainer';

import { boldFont, globalStyles } from '../styles/styles';

interface Props {
  customStart?: LatLng,
  customEnd?: LatLng,
  showUserLocation: boolean;
  waypoints: Array<Location>,
  showTitle?: boolean,
  style?: object,
  startAddress?: string,
  endAddress?: string,
  description?: string,
  handleMapPress?: (event: MapPressEvent) => void,
  handlePoiPress?: (event: PoiClickEvent) => void,
}

export default function MapModal({
  showUserLocation,
  waypoints,
  style,
  showTitle = true,
  customStart,
  customEnd,
  startAddress,
  endAddress,
  description,
  handleMapPress,
  handlePoiPress,
}: Props) {
  return (
    <View style={{ height: '100%', width: '100%' }}>
      {showTitle && (
      <Text style={globalStyles.title}>
        Map View
      </Text>
      )}
      {description && (
      <Text style={{ ...globalStyles.h3, fontFamily: boldFont }}>
        {description}
      </Text>
      )}
      {(!!startAddress || !!endAddress) && (
      <View style={{ marginVertical: 8 }}>
        <Text style={globalStyles.h3} numberOfLines={1}>
          {`Start: ${startAddress || 'Not set'}`}
        </Text>
        <Text style={globalStyles.h3} numberOfLines={1}>
          {`End: ${endAddress || 'Not set'}`}
        </Text>
      </View>
      )}
      <MapContainer
        showUserLocation={showUserLocation}
        customStart={customStart}
        customEnd={customEnd}
        waypoints={waypoints}
        onPress={handleMapPress}
        onPoiClick={handlePoiPress}
        style={style}
      />
    </View>
  );
}

MapModal.defaultProps = {
  showTitle: true,
  style: undefined,
  handleMapPress: undefined,
  handlePoiPress: undefined,
  customStart: undefined,
  customEnd: undefined,
  startAddress: undefined,
  endAddress: undefined,
  description: undefined,
};
