// React
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Screens
import FriendsScreen from './Friends/FriendsScreen';
import SplitwiseScreen from './Friends/SplitwiseScreen';
import LoginScreen from './Auth/LoginScreen';
import FriendInfoScreen from './Friends/FriendInfoScreen';
import PaywallScreen from './PaywallScreen';

// Styles
import { colors } from '../styles/styles';

const RootStack = createStackNavigator();

export default function FriendsTab() {
  const [user, loading, error] = useAuthState(auth);
  const [{
    uid, email, name, amount,
  }, setFriend] = useState<FriendObject>({
    uid: '',
    email: '',
    name: '',
    amount: 0,
  });

  if (!user || loading || error) {
    return (
      <LoginScreen />
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.purple,
          height: 80,
        },
        headerTitleStyle: { color: colors.white },
        headerTintColor: colors.white,
      }}
      initialRouteName="Friends"
    >
      <RootStack.Screen
        name="Friends"
        options={{
          headerShown: false,
          title: 'All Friends',
          gestureDirection: 'horizontal-inverted',
        }}
      >
        {({ navigation }) => <FriendsScreen navigation={navigation} setFriend={setFriend} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="Splitwise"
        options={{
          headerShown: false,
          title: 'All Friends',
          gestureDirection: 'horizontal',
        }}
        component={SplitwiseScreen}
      />
      <RootStack.Screen
        name="Friend"
        options={{ headerShown: true }}
      >
        {({ navigation }) => (
          <FriendInfoScreen
            navigation={navigation}
            uid={uid}
            email={email}
            name={name}
            amount={amount}
          />
        )}
      </RootStack.Screen>
      <RootStack.Screen
        name="Paywall"
        options={{ headerShown: false }}
      >
        {({ navigation }) => <PaywallScreen navigation={navigation} />}
      </RootStack.Screen>
    </RootStack.Navigator>
  );
}
