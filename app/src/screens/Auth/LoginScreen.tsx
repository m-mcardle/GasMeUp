// React
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
// Screen
import SignUpScreen from './SignUpScreen';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';
import Button from '../../components/Button';

import LoginSection from './components/LoginSection';

// Styles
import { color, radius, space } from '../../styles/theme';
import { stackScreenOptions } from '../../styles/navigation';

// @ts-ignore
import AppIcon from '../../../assets/car.png';

interface Props {
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export const authStyles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: space.xxxl,
    paddingBottom: space.xxl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    marginBottom: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.borderStrong,
  },
  subtitle: {
    marginTop: space.sm,
    maxWidth: 300,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.xl,
  },
});

function LoginPage({ navigation }: Props) {
  return (
    <Page scroll>
      <View style={authStyles.hero}>
        <Image source={AppIcon} style={authStyles.logo} />
        <Text variant="title1" align="center">Welcome back</Text>
        <Text variant="subhead" tone="secondary" align="center" style={authStyles.subtitle}>
          Sign in to save trips and split gas costs with friends.
        </Text>
      </View>
      <LoginSection />
      <View style={authStyles.footer}>
        <Text variant="subhead" tone="secondary">New to GasMeUp?</Text>
        <Button variant="ghost" size="sm" title="Create an account" onPress={() => navigation.navigate('Sign Up')} />
      </View>
    </Page>
  );
}

const RootStack = createStackNavigator();

export default function LoginScreen() {
  return (
    <RootStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginPage} />
      </RootStack.Group>
      <RootStack.Group>
        <RootStack.Screen name="Sign Up" component={SignUpScreen} options={{ title: 'Create account' }} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
