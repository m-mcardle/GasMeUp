// Expo imports
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { LocationSubscription } from 'expo-location';

// React imports
import React, {
  useState, useMemo, useEffect, useRef,
} from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Firebase
import firebase from './firebase';

// Global State
import { GlobalContext, initialState } from './src/hooks/hooks';

// Screens
import HomeTab from './src/screens/HomeTab';
import FriendsTab from './src/screens/FriendsTab';
import GasPriceScreen from './src/screens/GasPriceScreen';
import CarScreen from './src/screens/CarScreen';

// Styles
import { colors } from './src/styles/styles';

// Helpers
import { getUserLocationSubscription } from './src/helpers/locationHelper';
import { registerForPushNotificationsAsync } from './src/helpers/notificationHelper';
import { getExchangeRate } from './src/helpers/unitsHelper';
import { logScreenView } from './src/helpers/analyticsHelper';

SplashScreen.preventAutoHideAsync();

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
  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'ios-square';

  switch (name) {
    case 'Home':
      iconName = focused
        ? 'ios-calculator'
        : 'ios-calculator-outline';
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
    case 'Car':
      iconName = focused
        ? 'ios-car'
        : 'ios-car-outline';
      break;
    case 'Gas Prices':
      return <FontAwesome5 name="gas-pump" size={size} color={color} />;
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
  const [locationSubscription, setLocationSubscription] = useState<LocationSubscription>();

  const routeNameRef = React.useRef<string | null>(null);
  const navigationRef = React.useRef<NavigationContainerRef<any> | null>(null);

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

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    async function hideSplashScreen() {
      await SplashScreen.hideAsync();
    }

    if (fontsLoaded) {
      hideSplashScreen();
    }
  }, [fontsLoaded]);

  // Location initialization
  useEffect(() => {
    const getSubscription = async () => {
      const subscription = await getUserLocationSubscription(updateGlobalState);
      setLocationSubscription(subscription);
    };

    getSubscription();

    return () => {
      locationSubscription?.remove();
    };
  }, []);

  const [, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Notification initialization
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => token && updateGlobalState('expoToken', token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Exchange Rate initialization
  useEffect(() => {
    async function fetchRate() {
      const exchangeRate = await getExchangeRate();
      updateGlobalState('exchangeRate', exchangeRate);
    }

    fetchRate();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalContext.Provider value={state}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef?.current?.getCurrentRoute()?.name ?? 'Unknown';
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef?.current?.getCurrentRoute()?.name ?? 'Unknown';

          if (previousRouteName !== currentRouteName) {
            logScreenView(currentRouteName);
          }
          routeNameRef.current = currentRouteName;
        }}
      >
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }: { route: any }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }:
            { focused: boolean, color: string, size: number }) => TabIcon(
              {
                name: route.name,
                focused,
                color,
                size,
              },
            ),
            tabBarActiveTintColor: colors.action,
            tabBarInactiveTintColor: colors.secondary,
            tabBarStyle: { backgroundColor: colors.primary },
          })}
        >
          <Tab.Screen name="Friends" component={FriendsTab} />
          <Tab.Screen name="Home" component={HomeTab} />
          <Tab.Screen name="Gas Prices" component={GasPriceScreen} />
          <Tab.Screen name="Car" component={CarScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GlobalContext.Provider>
  );
}
