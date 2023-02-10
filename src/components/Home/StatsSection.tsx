import React, {
  useEffect, useRef,
} from 'react';
import {
  ActivityIndicator, Animated, Easing, View,
} from 'react-native';

import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// Global State Stuff
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { convertKMtoMiles, convertLtoGallons } from '../../helpers/unitsHelper';

// Components
import Text from '../Text';
import AnimatedGradient from '../AnimatedGradient';

// Styles
import styles from '../../styles/HomeScreen.styles';
import { colors } from '../../styles/styles';

interface Props {
  loading: boolean,
  distance: number,
  gasPrice: number,
  useCustomGasPrice: boolean,
  cost: number,
  gasMileage: number,
  openModal: () => void,
}

export default function StatsSection(props: Props) {
  const {
    loading,
    distance = 0,
    gasPrice = 0,
    gasMileage,
    useCustomGasPrice,
    cost,
    openModal,
  } = props;
  const [globalState] = useGlobalState();

  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const fadeIn = Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1500,
    useNativeDriver: true,
    easing: Easing.quad,
  });

  const fadeOut = Animated.timing(fadeAnim, {
    toValue: 0.5,
    duration: 1500,
    useNativeDriver: true,
    easing: Easing.quad,
  });

  const sequence = Animated.sequence([fadeIn, fadeOut]);
  const animation = Animated.loop(sequence);

  // Start the animation if the data is loading, otherwise stop it
  useEffect(() => {
    if (loading) {
      animation.start();
    } else {
      animation.stop();
      fadeAnim.setValue(1);
    }
  }, [loading, fadeAnim]);

  const gasUsed = (distance * gasMileage) / 100;

  const gasUsedString = globalState.country === 'CA'
    ? `${gasUsed.toFixed(2)}L`
    : `${(convertLtoGallons(gasUsed)).toFixed(2)}gal`;

  const gasPriceString = globalState.country === 'CA'
    ? `$${gasPrice.toFixed(2)}/L`
    : `$${gasPrice.toFixed(2)}/gal`;

  const distanceString = globalState.country === 'CA'
    ? `${distance.toFixed(2)} km`
    : `${(convertKMtoMiles(distance)).toFixed(2)} mi`;

  // TODO - Add support for mpg
  const fuelEfficiencyString = `${gasMileage.toFixed(1)}L/100km`;

  const costSectionGradient = [
    '#118C4F',
    '#006241',
    '#7851a9',
    '#603fef',
  ];

  const statBoxLoadingGradient = [
    colors.tertiary,
    colors.darkestGray,
    colors.lightTertiary,
  ];

  const statBoxGradient = [
    colors.tertiary,
    colors.tertiary,
  ];

  return (
    <View style={styles.statsSection}>
      <AnimatedGradient
        animate={loading}
        style={styles.costSection}
        colors={costSectionGradient}
      >
        {loading
          ? <ActivityIndicator size="large" />
          : (
            <Text style={styles.costText}>
              $
              {cost.toFixed(2)}
            </Text>
          )}
      </AnimatedGradient>
      <View style={styles.subStatsSection}>
        <AnimatedGradient
          animate={loading}
          style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          colors={loading ? statBoxLoadingGradient : statBoxGradient}
        >
          <View style={styles.statText}>
            <FontAwesome5 name="route" size={16} color={colors.gray} />
            <Text style={styles.statBoxText}>
              {loading ? '' : distanceString}
            </Text>
          </View>
        </AnimatedGradient>
        <AnimatedGradient
          animate={loading}
          style={[
            styles.statBox,
            (loading ? { justifyContent: 'center' } : undefined),
            (useCustomGasPrice ? { borderColor: colors.secondaryAction, borderWidth: 1 } : {}),
          ]}
          colors={loading ? statBoxLoadingGradient : statBoxGradient}
          onTouchEnd={() => openModal()}
        >
          <View style={styles.statText}>
            <Ionicons name="ios-pricetag" size={16} color={colors.gray} />
            <Text style={styles.statBoxText}>
              {loading ? '' : gasPriceString}
            </Text>
          </View>
        </AnimatedGradient>
      </View>
      <View style={styles.subStatsSection}>
        <AnimatedGradient
          animate={loading}
          style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          colors={loading ? statBoxLoadingGradient : statBoxGradient}
        >
          <View style={styles.statText}>
            <FontAwesome5 name="car" size={16} color={colors.gray} />
            <Text style={styles.statBoxText}>
              {loading ? '' : fuelEfficiencyString}
            </Text>
          </View>
        </AnimatedGradient>
        <AnimatedGradient
          animate={loading}
          style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          colors={loading ? statBoxLoadingGradient : statBoxGradient}
        >
          <View style={styles.statText}>
            <FontAwesome5 name="gas-pump" size={16} color={colors.gray} />
            <Text style={styles.statBoxText}>
              {loading ? '' : gasUsedString}
            </Text>
          </View>
        </AnimatedGradient>
      </View>
    </View>
  );
}
