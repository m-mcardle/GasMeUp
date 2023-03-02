import React, {
  useEffect, useRef,
} from 'react';
import {
  Animated, Easing, View,
} from 'react-native';

import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';

// Helpers
import {
  convertLtoGallons, convertAllToString,
} from '../../helpers/unitsHelper';

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
  locale: 'CA' | 'US',
  openModal: () => void,
  openFuelModal: () => void,
}

export default function StatsSection(props: Props) {
  const {
    loading,
    distance = 0,
    gasPrice = 0,
    gasMileage,
    useCustomGasPrice,
    cost,
    locale,
    openModal,
    openFuelModal,
  } = props;

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

  // L
  const gasUsed = (distance * gasMileage) / 100;

  const convertedStats = convertAllToString(
    distance,
    gasMileage,
    gasPrice,
    locale,
  );
  const gasUsedString = locale === 'CA'
    ? `${gasUsed.toFixed(2)}L`
    : `${(convertLtoGallons(gasUsed)).toFixed(2)}gal`;

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

  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });
  const costString = formatter.format(cost);
  const costStringLength = costString.length;

  // Set the font size based on the length of the cost
  const costFontSize = 64 - Math.min(48, Math.max(0, costStringLength - 8) * 8);

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
            <Text style={{ ...styles.costText, fontSize: costFontSize }}>
              {costString}
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
                    {convertedStats.distance}
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
                    {/* TODO */}
                    {gasUsedString}
                  </Text>
                )}
            </View>
          </View>
        </View>
        <View style={styles.subStatsSection}>
          <View
            style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}
            onTouchEnd={() => openFuelModal()}
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
                    {convertedStats.fuelEfficiency}
                    {'  '}
                    <Ionicons name="chevron-up-circle" size={12} color={colors.gray} />
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
                    {convertedStats.gasPrice}
                    {'  '}
                    <Ionicons name="chevron-up-circle" size={12} color={useCustomGasPrice ? colors.action : colors.gray} />
                  </Text>
                )}
            </View>
          </View>
        </View>
      </AnimatedGradient>
    </View>
  );
}
