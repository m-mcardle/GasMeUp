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
import { convertAllToString } from '../../helpers/unitsHelper';

interface Props {
  setMapVisible: () => void,
  transaction: DocumentData,
  transactionAmount: number,
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
    globalState.Locale,
  );

  const formattedAmountOwed = transactionAmount < 0 ? `-$${Math.abs(transactionAmount).toFixed(2)}` : `$${transactionAmount.toFixed(2)}`;
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
          showUserLocation={false}
          waypoints={transactionWaypoints}
          style={{ height: '50%', width: '90%', backgroundColor: 'white' }}
          onPress={() => setMapVisible()}
        />
        )}
        <View style={styles.tripDetailsLocationSection}>
          <Text numberOfLines={1}>{`Start: ${transaction.startLocation}`}</Text>
          <Text numberOfLines={1}>{`End: ${transaction.endLocation}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text>{`Total: $${transaction.cost.toFixed(2)}`}</Text>
          <Text>{`Amount Owed: ${formattedAmountOwed}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text>{`Distance: ${convertedStats.distance}`}</Text>
          <Text>{`Gas Price: ${convertedStats.gasPrice}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text>{`Date: ${transaction.date?.toDate().toLocaleDateString()}`}</Text>
        </View>
      </View>
    </View>
  );
}
