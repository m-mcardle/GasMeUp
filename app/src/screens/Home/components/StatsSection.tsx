import React, { useEffect, useRef } from 'react';
import {
  Animated, Easing, Pressable, StyleSheet, View,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Helpers
import {
  convertLtoGallons, convertAllToString,
} from '../../../helpers/unitsHelper';

// Components
import Text from '../../../components/Text';

// Styles
import {
  gradient, palette, radius, shadow, space,
} from '../../../styles/theme';

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
  canSave?: boolean,
  onSave?: () => void,
}

const onHero = 'rgba(255,255,255,0.72)';

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: space.lg,
    ...shadow.glow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    marginTop: space.xs,
    marginBottom: space.lg,
    color: '#FFFFFF',
  },
  hint: {
    color: 'rgba(255,255,255,0.72)',
    marginTop: -space.sm,
    marginBottom: space.lg,
  },
  save: {
    marginTop: space.lg,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    gap: 2,
  },
  tileEditable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  customPill: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});

interface TileProps {
  label: string,
  value: string,
  icon: React.ReactNode,
  loading: boolean,
  pulse: Animated.Value,
  pulses?: boolean,
  custom?: boolean,
  onPress?: () => void,
}

function StatTile({
  label, value, icon, loading, pulse, pulses = false, custom = false, onPress,
}: TileProps) {
  const content = (
    <>
      <View style={styles.tileLabel}>
        {icon}
        <Text variant="caption" style={{ color: onHero }}>{label}</Text>
        {onPress && !custom && <Ionicons name="pencil" size={11} color={onHero} style={{ marginLeft: 'auto' }} />}
        {custom && (
          <View style={styles.customPill}>
            <Text variant="caption" tone="onPrimary" style={{ fontSize: 10, lineHeight: 13 }}>Custom</Text>
          </View>
        )}
      </View>
      {/* A view's opacity must stay bound to `pulse` for its whole life: swapping a
          native-driven value for a literal leaves it stuck at the last animated opacity. */}
      <Animated.View style={pulses ? { opacity: pulse } : null}>
        <Text variant="headline" tone="onPrimary" numberOfLines={1}>{loading ? '—' : value}</Text>
      </Animated.View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}. Tap to change.`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          styles.tileEditable,
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.tile}>{content}</View>;
}

// Hero card on the Calculate screen: the trip cost plus the four inputs that produce it.
export default function StatsSection({
  loading,
  distance = 0,
  gasPrice = 0,
  gasMileage,
  useCustomGasPrice,
  cost,
  locale,
  openModal,
  openFuelModal,
  canSave = false,
  onSave,
}: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) {
      pulse.setValue(1);
      return undefined;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [loading, pulse]);

  // L
  const gasUsed = (distance * gasMileage) / 100;

  const convertedStats = convertAllToString(
    distance,
    gasMileage,
    gasPrice,
    locale,
  );
  const gasUsedString = locale === 'CA'
    ? `${gasUsed.toFixed(1)} L`
    : `${(convertLtoGallons(gasUsed)).toFixed(1)} gal`;

  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });
  const costString = formatter.format(cost);
  const hasTrip = distance > 0;

  const iconColor = onHero;

  return (
    <LinearGradient
      colors={gradient.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text variant="overline" style={{ color: onHero }}>Estimated trip cost</Text>
        {useCustomGasPrice && <Ionicons name="pricetag" size={14} color={onHero} />}
      </View>
      <Animated.View style={{ opacity: pulse }}>
        <Text
          variant="display"
          style={[styles.amount, !hasTrip && !loading ? { color: 'rgba(255,255,255,0.55)' } : null]}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`Estimated trip cost ${costString}`}
        >
          {costString}
        </Text>
      </Animated.View>
      {!hasTrip && !loading && (
        <Text variant="footnote" style={styles.hint}>
          Choose a start and destination to see what the drive costs.
        </Text>
      )}
      <View style={styles.grid}>
        <StatTile
          label="Distance"
          value={hasTrip ? convertedStats.distance : '—'}
          icon={<MaterialCommunityIcons name="map-marker-distance" size={13} color={iconColor} />}
          loading={loading}
          pulse={pulse}
          pulses
        />
        <StatTile
          label="Fuel used"
          value={hasTrip ? gasUsedString : '—'}
          icon={<MaterialCommunityIcons name="water-outline" size={13} color={iconColor} />}
          loading={loading}
          pulse={pulse}
          pulses
        />
        <StatTile
          label="Efficiency"
          value={convertedStats.fuelEfficiency}
          icon={<Ionicons name="speedometer-outline" size={13} color={iconColor} />}
          loading={false}
          pulse={pulse}
          onPress={openFuelModal}
        />
        <StatTile
          label="Gas price"
          value={gasPrice ? convertedStats.gasPrice : '—'}
          icon={<MaterialCommunityIcons name="gas-station-outline" size={13} color={iconColor} />}
          loading={false}
          pulse={pulse}
          custom={useCustomGasPrice}
          onPress={openModal}
        />
      </View>
      {canSave && onSave && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save trip and split with friends"
          onPress={onSave}
          style={({ pressed }) => [styles.save, pressed ? { opacity: 0.85 } : null]}
        >
          <Ionicons name="people" size={18} color={palette.violet700} />
          <Text variant="headline" style={{ color: palette.violet700 }}>Save &amp; split with friends</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}
