import { ActivityIndicator, Image, View } from 'react-native';

// @ts-ignore
import AdjustIcon from '../../../assets/AdjustButton.png';

import Text from '../Text';

import styles from '../../styles/HomeScreen.styles';

interface Props {
  loading: boolean,
  cost: number,
  riders: number,
  distance: number,
  gasPrice: number,
}

export default function StatsSection(props: Props) {
  const {
    loading, cost = 0, riders = 0, distance = 0, gasPrice = 0,
  } = props;

  return (
    <View style={styles.statsSection}>
      <View style={styles.costSection}>
        {loading
          ? <ActivityIndicator size="large" />
          : (
            <Text style={styles.costText}>
              $
              {(cost / riders).toFixed(2)}
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
          <Image source={AdjustIcon} style={styles.adjustButton} />
        </View>
      </View>
    </View>
  );
}
