// React
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// import type { StackScreenProps } from '@react-navigation/stack';

// Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Screens
import FriendsScreen from './Friends/FriendsScreen';
import LoginScreen from './Auth/LoginScreen';
import FriendInfoScreen from './Friends/FriendInfoScreen';

// Styles
import { colors } from '../styles/styles';

const RootStack = createStackNavigator();

export default function FriendsTab() {
  const [user, loading, error] = useAuthState(auth);
  const [{
    uid, email, name, amount,
  }, setFriend] = useState({
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
      }}
      initialRouteName="Index"
    >
      <RootStack.Screen
        name="Index"
        options={{
          headerShown: false,
          title: 'All Friends',
        }}
      >
        {({ navigation }) => <FriendsScreen navigation={navigation} setFriend={setFriend} />}
      </RootStack.Screen>
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
    </RootStack.Navigator>
  );
}
