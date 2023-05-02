// React
import React from 'react';
import { View } from 'react-native';

// Firebase
import {
  DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../firebase';

// Global State
import { useGlobalState } from '../../../hooks/hooks';

// Components
import Text from '../../../components/Text';
import MapContainer from '../../../components/MapContainer';

// Styles
import styles from '../../../styles/FriendsScreen.styles';

// Helpers
import { convertAllToString } from '../../../helpers/unitsHelper';

interface Props {
  setMapVisible: () => void,
  transaction: DocumentData,
  transactionAmount: number,
  transactionWaypoints: Array<Location>,
}

export default function TripDetailsModal({
  transactionWaypoints, transaction, transactionAmount, setMapVisible,
}: Props) {
  const [user] = useAuthState(auth);
  const [globalState] = useGlobalState();
  const convertedStats = convertAllToString(
    transaction.distance,
    transaction.gasMilage ?? 10,
    transaction.gasPrice,
    globalState.Locale,
  );

  const riders = (transaction.payers?.length ?? 1) + 1;
  const startLocation = transaction.startLocation ?? 'Unknown';
  const endLocation = transaction.endLocation ?? 'Unknown';

  const formattedAmountOwed = transactionAmount < 0 ? `You Owe: $${Math.abs(transactionAmount).toFixed(2)}` : `You Are Owed: $${transactionAmount.toFixed(2)}`;
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
          showFullscreenButton
        />
        )}
        <View style={styles.tripDetailsLocationSection}>
          <Text numberOfLines={1} style={{ fontSize: 8, padding: 4 }}>{`Start: ${startLocation}`}</Text>
          <Text numberOfLines={1} style={{ fontSize: 8, padding: 4 }}>{`End: ${endLocation}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text style={{ fontSize: 10 }}>{`Total: $${transaction.cost.toFixed(2)}`}</Text>
          <Text style={{ fontSize: 10 }}>{formattedAmountOwed}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text style={{ fontSize: 10 }}>{`Distance: ${convertedStats.distance}`}</Text>
          <Text style={{ fontSize: 10 }}>{`Date: ${transaction.date?.toDate().toLocaleDateString()}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text style={{ fontSize: 10 }}>{`Gas Mileage: ${convertedStats.fuelEfficiency}`}</Text>
          <Text style={{ fontSize: 10 }}>{`Gas Price: ${convertedStats.gasPrice}`}</Text>
        </View>
        <View style={styles.tripDetailsStatsSection}>
          <Text style={{ fontSize: 10 }}>{`Riders: ${riders}`}</Text>
          <Text style={{ fontSize: 10 }}>{`Created By: ${transaction.creator === user?.uid ? 'You' : 'Them'}`}</Text>
        </View>
      </View>
    </View>
  );
}
