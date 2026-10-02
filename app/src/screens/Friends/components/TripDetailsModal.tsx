// React
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
import { color, radius, space } from '../../../styles/theme';

// Helpers
import { convertAllToString } from '../../../helpers/unitsHelper';

interface Props {
  setMapVisible: () => void,
  transaction: DocumentData,
  transactionAmount: number,
  transactionWaypoints: Array<Location>,
}

const styles = StyleSheet.create({
  container: {
    gap: space.lg,
  },
  route: {
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  stat: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    gap: 2,
  },
});

function Stat({ label, value, tone }: { label: string, value: string, tone?: 'success' | 'danger' }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" tone="tertiary">{label}</Text>
      <Text variant="headline" tone={tone ?? 'primary'} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function TripDetailsModal({
  transactionWaypoints, transaction, transactionAmount, setMapVisible,
}: Props) {
  const [user] = useAuthState(auth);
  const [globalState] = useGlobalState();

  if (!transaction?.date) {
    return null;
  }

  const convertedStats = convertAllToString(
    transaction.distance ?? 0,
    // Older trips were written with the misspelt `gasMilage` key.
    transaction.gasMileage ?? transaction.gasMilage ?? 10,
    transaction.gasPrice ?? 0,
    globalState.Locale,
  );

  const riders = (transaction.payers?.length ?? 1) + 1;
  const startLocation = transaction.startLocation ?? 'Unknown';
  const endLocation = transaction.endLocation ?? 'Unknown';
  const youOwe = transactionAmount < 0;

  return (
    <View style={styles.container}>
      {transactionWaypoints.length > 0 && (
        <MapContainer
          showUserLocation={false}
          waypoints={transactionWaypoints}
          style={{ height: 170 }}
          onPress={() => setMapVisible()}
          showFullscreenButton
        />
      )}
      <View style={styles.route}>
        <View style={styles.endpoint}>
          <View style={[styles.dot, { backgroundColor: color.primaryText }]} />
          <Text variant="footnote" numberOfLines={1} style={{ flex: 1 }}>{startLocation}</Text>
        </View>
        <View style={styles.endpoint}>
          <View style={[styles.dot, { backgroundColor: color.success }]} />
          <Text variant="footnote" numberOfLines={1} style={{ flex: 1 }}>{endLocation}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <Stat label="Trip total" value={`$${(transaction.cost ?? 0).toFixed(2)}`} />
        <Stat
          label={youOwe ? 'You owe' : 'You’re owed'}
          value={`$${Math.abs(transactionAmount).toFixed(2)}`}
          tone={youOwe ? 'danger' : 'success'}
        />
        <Stat label="Distance" value={convertedStats.distance} />
        <Stat label="Date" value={transaction.date.toDate().toLocaleDateString()} />
        <Stat label="Efficiency" value={convertedStats.fuelEfficiency} />
        <Stat label="Gas price" value={convertedStats.gasPrice} />
        <Stat label="People" value={`${riders}`} />
        <Stat label="Added by" value={transaction.creator === user?.uid ? 'You' : 'Them'} />
      </View>
    </View>
  );
}
