import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

// @ts-ignore
import AdjustIcon from '../../../assets/AdjustButton.png';

import Text from '../Text';

import styles from '../../styles/HomeScreen.styles';

interface Props {
  loading: boolean,
  riders: number,
  distance: number,
  gasPrice: number,
  openModal: () => void,
}

const FUEL_EFFECIENCY = 10;

export default function StatsSection(props: Props) {
  const {
    loading,
    riders = 0,
    distance = 0,
    gasPrice = 0,
    openModal,
  } = props;

  const cost = ((distance * FUEL_EFFECIENCY) / 100) * gasPrice;
  const safeRiders = riders < 1 ? 1 : riders;
  return (
    <View style={styles.statsSection}>
      <View style={styles.costSection}>
        {loading
          ? <ActivityIndicator size="large" />
          : (
            <Text style={styles.costText}>
              $
              {(cost / safeRiders).toFixed(2)}
            </Text>
          )}
      </View>
      <View style={styles.subStatsSection}>
        <Text style={{ ...styles.statBox, ...styles.statBoxText }}>
          {`Distance: ${distance.toFixed(2)} km`}
        </Text>
        <View style={styles.statBox}>
          <Text style={styles.statBoxText}>
            {`Gas: $${gasPrice.toFixed(2)}/L`}
          </Text>
          <View onTouchEnd={() => openModal()}>
            <Image source={AdjustIcon} style={styles.adjustButton} />
          </View>
        </View>
      </View>
    </View>
  );
}
