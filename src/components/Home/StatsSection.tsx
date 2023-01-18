import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

// @ts-ignore
import AdjustIcon from '../../../assets/AdjustButton.png';
// @ts-ignore
import AdjustIconDisabled from '../../../assets/AdjustButtonDisabled.png';

import Text from '../Text';

import styles from '../../styles/HomeScreen.styles';

interface Props {
  loading: boolean,
  riders: number,
  distance: number,
  gasPrice: number,
  useCustomGasPrice: boolean,
  cost: number,
  openModal: () => void,
}

export default function StatsSection(props: Props) {
  const {
    loading,
    riders = 0,
    distance = 0,
    gasPrice = 0,
    useCustomGasPrice,
    cost,
    openModal,
  } = props;

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
        <View style={styles.statBox} onTouchEnd={() => openModal()}>
          <Text style={styles.statBoxText}>
            {`Gas: $${gasPrice.toFixed(2)}/L`}
          </Text>
          <View>
            <Image
              source={useCustomGasPrice ? AdjustIcon : AdjustIconDisabled}
              style={styles.adjustButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
