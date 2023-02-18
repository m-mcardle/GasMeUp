import React from 'react';
import { View } from 'react-native';

import Text from './Text';
import MapContainer from './MapContainer';

import { globalStyles } from '../styles/styles';

interface Props {
  data: MapData;
  showUserLocation: boolean;
  waypoints: Array<Location>,
  showTitle?: boolean,
  style?: object,
}

export default function MapModal({
  data, showUserLocation, waypoints, style, showTitle = true,
}: Props) {
  return (
    <View style={{ height: '100%', width: '100%' }}>
      {showTitle && (
      <Text style={globalStyles.title}>
        Map View
      </Text>
      )}
      <MapContainer
        data={data}
        showUserLocation={showUserLocation}
        waypoints={waypoints}
        style={style}
      />
    </View>
  );
}

MapModal.defaultProps = {
  showTitle: true,
  style: undefined,
};
