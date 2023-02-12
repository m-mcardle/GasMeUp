// React
import React from 'react';
import { View } from 'react-native';

// Firebase
import {
  DocumentData,
} from 'firebase/firestore';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Components
import Text from '../Text';
import MapContainer from '../MapContainer';

// Styles
import styles from '../../styles/FriendsScreen.styles';

// Helpers
import { locationToLatLng } from '../../helpers/mapHelper';
import { convertAllToString } from '../../helpers/unitsHelper';

interface Props {
  setMapVisible: () => void,
  transaction: DocumentData,
  transactionAmount: string,
  transactionWaypoints: Array<Location>,
}

export default function TripDetailsModal({
  transactionWaypoints, transaction, transactionAmount, setMapVisible,
}: Props) {
  const [globalState] = useGlobalState();
  const convertedStats = convertAllToString(
    transaction.distance,
    transaction.gasMilage ?? 10,
    transaction.gasPrice,
    'CA', // DB records are always in CA
    globalState.Locale,
  );
  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Text style={styles.friendInfoTitle}>Trip Details</Text>
      <View
        style={{
          width: '100%', height: '90%', alignItems: 'center',
        }}
      >
        {transactionWaypoints.length > 0 && (
        <MapContainer
          data={{
            start: {
              ...locationToLatLng(transactionWaypoints[0]),
            },
            end: {
              ...locationToLatLng(transactionWaypoints[transactionWaypoints.length - 1]),
            },
          }}
          showUserLocation={false}
          waypoints={transactionWaypoints}
          style={{ height: '50%', width: '90%', backgroundColor: 'white' }}
          onPress={() => setMapVisible()}
        />
        )}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 64,
        }}
        >
          <Text>{`Total: $${transaction.cost.toFixed(2)}`}</Text>
          <Text>{`Amount Owed: ${transactionAmount}`}</Text>
        </View>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12,
        }}
        >
          <Text>{`Distance: ${convertedStats.distance}`}</Text>
          <Text>{`Gas Price: ${convertedStats.gasPrice}`}</Text>
        </View>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12,
        }}
        >
          <Text>{`Date: ${transaction.date?.toDate().toLocaleDateString()}`}</Text>
        </View>
      </View>
    </View>
  );
}
