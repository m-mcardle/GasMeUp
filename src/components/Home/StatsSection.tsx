import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, Image, View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

// Global State Stuff
import { useGlobalState } from '../../hooks/hooks';

// @ts-ignore
import AdjustIcon from '../../../assets/AdjustButton.png';
// @ts-ignore
import AdjustIconDisabled from '../../../assets/AdjustButtonDisabled.png';

import Text from '../Text';

import styles from '../../styles/HomeScreen.styles';
import { colors } from '../../styles/styles';

interface Props {
  loading: boolean,
  distance: number,
  gasPrice: number,
  useCustomGasPrice: boolean,
  cost: number,
  openModal: () => void,
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function StatsSection(props: Props) {
  const {
    loading,
    distance = 0,
    gasPrice = 0,
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

  const gasPriceString = globalState.country === 'CA'
    ? `$${gasPrice.toFixed(2)}/L`
    : `$${gasPrice.toFixed(2)}/gal`;

  const distanceString = globalState.country === 'CA'
    ? `${distance.toFixed(2)} km`
    : `${(distance * 0.621371).toFixed(2)} mi`;

  return (
    <View style={styles.statsSection}>
      <AnimatedLinearGradient
        colors={[colors.green, colors.darkGreen]}
        start={{ x: 0.2, y: 0.2 }}
        style={{
          ...styles.costSection,
          opacity: fadeAnim, // Bind opacity to animated value
        }}
      >
        {loading
          ? <ActivityIndicator size="large" />
          : (
            <Text style={styles.costText}>
              $
              {cost.toFixed(2)}
            </Text>
          )}
      </AnimatedLinearGradient>
      <View style={styles.subStatsSection}>
        <View style={[styles.statBox, (loading ? { justifyContent: 'center' } : {})]}>
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <Text style={styles.statBoxText}>
                {`Distance: ${distanceString}`}
              </Text>
            )}
        </View>
        <View style={[styles.statBox, (loading ? { justifyContent: 'center' } : {})]} onTouchEnd={() => openModal()}>
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <>
                <Text style={styles.statBoxText}>
                  {`Gas: ${gasPriceString}`}
                </Text>
                <View>
                  <Image
                    source={useCustomGasPrice ? AdjustIcon : AdjustIconDisabled}
                    style={styles.adjustButton}
                  />
                </View>
              </>
            )}
        </View>
      </View>
    </View>
  );
}
