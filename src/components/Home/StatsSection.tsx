import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, Image, View,
} from 'react-native';

import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Global State Stuff
import { useGlobalState } from '../../hooks/hooks';

// Helpers
import { convertKMtoMiles, convertLtoGallons } from '../../helpers/unitsHelper';

// @ts-ignore
import AdjustIcon from '../../../assets/AdjustButton.png';
// @ts-ignore
import AdjustIconDisabled from '../../../assets/AdjustButtonDisabled.png';

// Components
import Text from '../Text';

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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
        <View style={[styles.statBox, (loading ? { justifyContent: 'center' } : undefined)]}>
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <View style={styles.statText}>
                <FontAwesome5 name="route" size={16} color={colors.gray} />
                <Text style={styles.statBoxText}>
                  {distanceString}
                </Text>
              </View>
            )}
        </View>
        <View
          style={[
            styles.statBox,
            (loading ? { justifyContent: 'center' } : undefined),
            (useCustomGasPrice ? { borderColor: colors.secondaryAction, borderWidth: 1 } : {}),
          ]}
          onTouchEnd={() => openModal()}
        >
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <>
                <View style={[styles.statText, { width: '75%' }]}>
                  <Ionicons name="ios-pricetag" size={16} color={colors.gray} />
                  <Text style={styles.statBoxText}>
                    {gasPriceString}
                  </Text>
                </View>
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
      <View style={styles.subStatsSection}>
        <View style={[styles.statBox, (loading ? { justifyContent: 'center' } : {})]}>
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <View style={styles.statText}>
                <FontAwesome5 name="car" size={16} color={colors.gray} />
                <Text style={styles.statBoxText}>
                  {fuelEfficiencyString}
                </Text>
              </View>
            )}
        </View>
        <View
          style={[
            styles.statBox,
            (loading ? { justifyContent: 'center' } : {}),
          ]}
          onTouchEnd={() => openModal()}
        >
          {loading
            ? <ActivityIndicator size="small" />
            : (
              <View style={[styles.statText, { width: '75%' }]}>
                <FontAwesome5 name="gas-pump" size={16} color={colors.gray} />
                <Text style={styles.statBoxText}>
                  {gasUsedString}
                </Text>
              </View>
            )}
        </View>
      </View>
    </View>
  );
}
