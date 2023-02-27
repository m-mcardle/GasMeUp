// React
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from './Home/HomeScreen';
import SettingsScreen from './Home/SettingsScreen';
import SaveTripScreen from './Home/SaveTripScreen';

// Styles
import { colors } from '../styles/styles';

const RootStack = createStackNavigator();

export default function HomeTab() {
  const [{
    start,
    end,
    cost,
    gasPrice,
    distance,
    gasMileage,
    waypoints,
  }, setTrip] = useState({
    start: 'string',
    end: '',
    cost: 0,
    gasPrice: 0,
    distance: 0,
    gasMileage: 0,
    waypoints: [],
  });

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
      initialRouteName="Index"
    >
      <RootStack.Screen
        name="Index"
        options={{
          headerShown: false,
          title: 'Home',
        }}
      >
        {({ navigation }) => <HomeScreen navigation={navigation} setTrip={setTrip} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="Save Trip"
        options={{ headerShown: true }}
      >
        {({ navigation }) => (
          <SaveTripScreen
            navigation={navigation}
            start={start}
            end={end}
            cost={cost}
            gasPrice={gasPrice}
            distance={distance}
            gasMileage={gasMileage}
            waypoints={waypoints}
          />
        )}
      </RootStack.Screen>
      <RootStack.Screen name="Settings" component={SettingsScreen} />
    </RootStack.Navigator>
  );
}
