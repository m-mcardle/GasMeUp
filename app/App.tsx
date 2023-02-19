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
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// React imports
import React, {
  useState, useMemo, useEffect, useRef,
} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Firebase
import firebase from './firebase';

// Global State
import { GlobalContext, initialState } from './src/hooks/hooks';

// Screens
import HomeTab from './src/screens/HomeTab';
import FriendsTab from './src/screens/FriendsTab';
import GasPriceScreen from './src/screens/GasPriceScreen';

// Styles
import { colors } from './src/styles/styles';

// Helpers
import { lookupProvince } from './src/helpers/locationHelper';
import { registerForPushNotificationsAsync } from './src/helpers/notificationHelper';
import { getExchangeRate } from './src/helpers/unitsHelper';

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
    case 'Calculate':
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
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      updateGlobalState('userLocation', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      const readableLocation = (await Location.reverseGeocodeAsync(location.coords))[0];

      if (readableLocation.country === 'Canada') {
        const provinceCode = lookupProvince(readableLocation.region ?? 'ON');
        updateGlobalState('region', provinceCode);
        updateGlobalState('country', 'CA');
      } else if (readableLocation.country === 'United States') {
        updateGlobalState('region', readableLocation.region);
        updateGlobalState('country', 'US');
      } else {
        updateGlobalState('region', 'ON');
        updateGlobalState('country', 'CA');
      }
    })();
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
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Calculate"
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
          <Tab.Screen name="Calculate" component={HomeTab} />
          <Tab.Screen name="Gas Prices" component={GasPriceScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GlobalContext.Provider>
  );
}
