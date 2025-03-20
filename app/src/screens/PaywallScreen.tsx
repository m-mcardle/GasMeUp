import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// Helpers
import { promptPurchase, getOffering, subscriptionPeriodMap } from '../helpers/billingHelper';

import { colors, globalStyles } from '../styles/styles';
import { styles } from '../styles/PaywallScreen';

// @ts-ignore
import GasMeUpLogo from '../../assets/car.png';

export default function PaywallScreen({ navigation }: any) {
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<PurchasesPackage[]>([]);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const fetchedOffering = await getOffering();
      setPlans(fetchedOffering?.availablePackages ?? []);
      setSelectedPlan(fetchedOffering?.availablePackages[0]?.identifier ?? null);
      setOffering(fetchedOffering);

      setLoadingPlans(false);
    };

    fetchPlans();
  }, []);

  const makePurchase = async () => {
    const success = await promptPurchase(selectedPlan!);

    if (success) {
      navigation.replace('Friends');
    }
  };

  if (loadingPlans || offering === null) {
    return (
      <LinearGradient
        colors={[colors.lightPurple, colors.purple]}
        start={{ x: 0.8, y: 0.2 }}
        style={{ ...globalStyles.page, ...styles.container }}
      />
    );
  }

  return (
    <LinearGradient
      colors={[colors.lightPurple, colors.purple]}
      start={{ x: 0.8, y: 0.2 }}
      style={{ ...globalStyles.page, ...styles.container }}
    >
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.replace('Friends')}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>GasMeUp Pro+</Text>
      <Text style={styles.subtitle}>Unlock more tools</Text>

      <View style={styles.iconContainer}>
        <Image source={GasMeUpLogo} style={{ width: 75, height: 75 }} />
      </View>

      <View style={styles.features}>
        <Text style={styles.featureItem}>
          <Text style={{ color: colors.teal }}>▶ </Text>
          Realtime gas price data
        </Text>
        <Text style={styles.featureItem}>
          <Text style={{ color: colors.teal }}>▶ </Text>
          Car fuel efficiency lookup
        </Text>
        <Text style={styles.featureItem}>
          <Text style={{ color: colors.teal }}>▶ </Text>
          Save and split trips
        </Text>
      </View>

      <Text style={styles.bestPricing}>Join today with our best pricing</Text>

      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.identifier}
          style={[styles.planOption, selectedPlan === plan.identifier && styles.selectedPlan]}
          onPress={() => setSelectedPlan(plan.identifier)}
        >
          <Ionicons
            name={selectedPlan === plan.identifier ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={24}
            color={selectedPlan === plan.identifier ? colors.teal : colors.lightGray}
          />
          <Text style={styles.planText}>
            {subscriptionPeriodMap[plan.product.subscriptionPeriod!] ?? 'Unknown'}
          </Text>
          <Text style={styles.planPrice}>{plan.product.priceString}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.cancelAnytime}>Join today, cancel anytime.</Text>

      <TouchableOpacity style={styles.continueButton} onPress={makePurchase}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Restore</Text>
        <Text style={styles.footerText}>Terms</Text>
        <Text style={styles.footerText}>Privacy</Text>
      </View>
    </LinearGradient>
  );
}
