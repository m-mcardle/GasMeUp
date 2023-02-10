import React, {
  useEffect, useRef,
} from 'react';
import {
  Animated, Easing, View,
} from 'react-native';

import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';

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
    '#1b1c2c',
    '#118C4F',
    '#006241',
  ];

  const statBoxLoadingGradient = [
    colors.tertiary,
    colors.darkestGray,
    colors.tertiary,
    colors.tertiary,
    colors.darkestGray,
    colors.tertiary,
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
        speed={1000}
      >
        {loading
          ? <ActivityIndicator animating size="large" />
          : (
            <Text style={styles.costText}>
              $
              {cost.toFixed(2)}
            </Text>
          )}
      </AnimatedGradient>
      <AnimatedGradient
        animate={loading}
        speed={4000}
        colors={loading ? statBoxLoadingGradient : statBoxGradient}
        x={0.1}
        y={0.1}
      >
        <View style={styles.subStatsSection}>
          <View
            style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          >
            <View style={styles.statText}>
              <FontAwesome5 name="route" size={16} color={colors.gray} />
              {loading
                ? (
                  <View style={styles.statBoxText}>
                    <Animated.View style={[styles.skeleton, { opacity: fadeAnim }]} />
                  </View>
                )
                : (
                  <Text style={styles.statBoxText}>
                    {distanceString}
                  </Text>
                )}
            </View>
          </View>
          <View
            style={[
              styles.statBox,
              (loading ? { justifyContent: 'center' } : undefined),
              (useCustomGasPrice ? { borderColor: colors.secondaryAction, borderWidth: 1 } : {}),
            ]}
            onTouchEnd={() => openModal()}
          >
            <View style={styles.statText}>
              <Ionicons name="ios-pricetag" size={16} color={colors.gray} />
              {loading
                ? (
                  <View style={styles.statBoxText}>
                    <Animated.View style={[styles.skeleton, { opacity: fadeAnim }]} />
                  </View>
                )
                : (
                  <Text style={styles.statBoxText}>
                    {gasPriceString}
                  </Text>
                )}
            </View>
          </View>
        </View>
        <View style={styles.subStatsSection}>
          <View
            style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          >
            <View style={styles.statText}>
              <FontAwesome5 name="car" size={16} color={colors.gray} />
              {loading
                ? (
                  <View style={styles.statBoxText}>
                    <Animated.View style={[styles.skeleton, { opacity: fadeAnim }]} />
                  </View>
                )
                : (
                  <Text style={styles.statBoxText}>
                    {fuelEfficiencyString}
                  </Text>
                )}
            </View>
          </View>
          <View
            style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
          >
            <View style={styles.statText}>
              <FontAwesome5 name="gas-pump" size={16} color={colors.gray} />
              {loading
                ? (
                  <View style={styles.statBoxText}>
                    <Animated.View style={[styles.skeleton, { opacity: fadeAnim }]} />
                  </View>
                )
                : (
                  <Text style={styles.statBoxText}>
                    {gasUsedString}
                  </Text>
                )}
            </View>
          </View>
        </View>
      </AnimatedGradient>
    </View>
  );
}
