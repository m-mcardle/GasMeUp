// Expo imports
import Ionicons from '@expo/vector-icons/Ionicons';
import AppLoading from 'expo-app-loading';
import {
  useFonts,
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Rubik_900Black,
  Rubik_300Light_Italic,
  Rubik_400Regular_Italic,
  Rubik_500Medium_Italic,
  Rubik_600SemiBold_Italic,
  Rubik_700Bold_Italic,
  Rubik_800ExtraBold_Italic,
  Rubik_900Black_Italic,
} from '@expo-google-fonts/rubik';

// React imports
import React, { useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Firebase
import firebase from './firebase';

// Global State
import { GlobalContext, initialState } from './src/hooks/hooks';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FriendsScreen from './src/screens/FriendsScreen';

// Styles
import { colors } from './src/styles/styles';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: string,
  focused: boolean,
  color: string,
  size: number
}

function TabIcon({
  name,
  focused,
  color,
  size,
} : TabIconProps) {
  let iconName: 'ios-home' | 'ios-home-outline' | 'ios-settings' | 'ios-settings-outline' | 'ios-square' | 'ios-people' | 'ios-people-outline' = 'ios-square';

  switch (name) {
    case 'Home':
      iconName = focused
        ? 'ios-home'
        : 'ios-home-outline';
      break;
    case 'Settings':
      iconName = focused
        ? 'ios-settings'
        : 'ios-settings-outline';
      break;
    case 'Friends':
      iconName = focused
        ? 'ios-people'
        : 'ios-people-outline';
      break;
    default:
      iconName = 'ios-square';
  }

  return (
    <Ionicons name={iconName} size={size} color={color} />
  );
}

// This is just to ensure that firebase is initialized on first rendering
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { auth } = firebase;

export default function App() {
  const [globalState, setGlobalState] = useState(initialState);

  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
    Rubik_900Black,
    Rubik_300Light_Italic,
    Rubik_400Regular_Italic,
    Rubik_500Medium_Italic,
    Rubik_600SemiBold_Italic,
    Rubik_700Bold_Italic,
    Rubik_800ExtraBold_Italic,
    Rubik_900Black_Italic,
  });

  const updateGlobalState = (key: string, newValue: any) => {
    setGlobalState((oldState: any) => {
      if (oldState[key] !== newValue) {
        const newState = { ...oldState };
        newState[key] = newValue;
        return newState;
      }
      return oldState;
    });
  };

  const state = useMemo(() => [globalState, updateGlobalState], [globalState]);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <GlobalContext.Provider value={state}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => TabIcon(
              {
                name: route.name,
                focused,
                color,
                size,
              },
            ),
            tabBarActiveTintColor: colors.tertiary,
            tabBarInactiveTintColor: colors.secondary,
            tabBarStyle: { backgroundColor: colors.primary },
          })}
        >
          <Tab.Screen name="Friends" component={FriendsScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GlobalContext.Provider>
  );
}
