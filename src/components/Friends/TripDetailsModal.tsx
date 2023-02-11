// React
import React from 'react';
import { View } from 'react-native';

// Firebase
import {
  DocumentData,
} from 'firebase/firestore';

// Components
import Text from '../Text';
import Button from '../Button';
import MapContainer from '../MapContainer';

// Styles
import styles from '../../styles/FriendsScreen.styles';

// Helpers
import { locationToLatLng } from '../../helpers/mapHelper';

interface Props {
  setMapVisible: () => void,
  transaction: DocumentData,
  transactionAmount: string,
  transactionWaypoints: Array<Location>,
}

export default function TripDetailsModal({
  transactionWaypoints, transaction, transactionAmount, setMapVisible,
}: Props) {
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
          style={{ height: '50%', backgroundColor: 'white' }}
        />
        )}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12,
        }}
        >
          <Text>{`Total: $${transaction.cost.toFixed(2)}`}</Text>
          <Text>{`Amount Owed: ${transactionAmount}`}</Text>
        </View>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12,
        }}
        >
          <Text>{`Distance: ${transaction.distance.toFixed(2)} km`}</Text>
          <Text>{`Gas Price: $${transaction.gasPrice.toFixed(2)}/L`}</Text>
        </View>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12,
        }}
        >
          <Text>{`Date: ${transaction.date?.toDate().toLocaleDateString()}`}</Text>
        </View>
        <Button onPress={setMapVisible} style={{ width: '60%', marginTop: 'auto' }}>
          <Text>View On Map</Text>
        </Button>
      </View>
    </View>
  );
}
