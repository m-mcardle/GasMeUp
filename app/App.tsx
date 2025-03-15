// Expo imports
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

// Sentry
import * as Sentry from '@sentry/react-native';

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
import MaintenanceScreen from './src/screens/MaintenanceScreen';

// Components
import TabIcon from './src/components/TabIcon';

// Styles
import { colors } from './src/styles/styles';

// Helpers
import { getUserLocationSubscription } from './src/helpers/locationHelper';
import { registerForPushNotificationsAsync } from './src/helpers/notificationHelper';
import { getExchangeRate } from './src/helpers/unitsHelper';
import { logScreenView } from './src/helpers/analyticsHelper';
import { getNumberConfig, initializeRemoteConfig, isFeatureEnabled } from './src/helpers/featureHelper';

Sentry.init({
  dsn: 'https://b385eda3b86e83abcd85a93b6b64e8a6@o4508982712664064.ingest.us.sentry.io/4508982713843712',
  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

// This is just to ensure that firebase is initialized on first rendering
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { auth } = firebase;

export default Sentry.wrap(() => {
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

  const initializeNotifications = () => {
    registerForPushNotificationsAsync().then((token) => token && updateGlobalState('expoToken', token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Fired when a notification is received while the app is open
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Fired when a user taps on a notification
      console.log(response);
    });
  };

  const cleanupNotificationSubscriptions = () => {
    Notifications.removeNotificationSubscription(notificationListener.current);
    Notifications.removeNotificationSubscription(responseListener.current);
  };

  const initializeExchangeRate = () => {
    async function fetchRate() {
      const exchangeRate = await getExchangeRate();
      updateGlobalState('exchangeRate', exchangeRate);
    }

    const shouldFetchRate = isFeatureEnabled('fetch_exchange_rate');
    if (shouldFetchRate) {
      console.log('Fetching exchange rate');
      fetchRate();
    } else {
      const configRate = getNumberConfig('exchange_rate');
      console.log('Using config rate', configRate);
      updateGlobalState('exchangeRate', configRate);
    }
  };

  // App initialization
  useEffect(() => {
    async function initialize() {
      await initializeRemoteConfig();

      initializeExchangeRate();
      initializeNotifications();
    }

    initialize();

    return () => {
      cleanupNotificationSubscriptions();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (isFeatureEnabled('maintenance_mode')) {
    return (
      <MaintenanceScreen />
    );
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
          {isFeatureEnabled('friends_screen') && <Tab.Screen name="Friends/Login" component={FriendsTab} options={{ title: 'Friends' }} />}
          {isFeatureEnabled('home_screen') && <Tab.Screen name="Home" component={HomeTab} options={{ title: 'Calculate' }} />}
          {isFeatureEnabled('gas_screen') && <Tab.Screen name="Gas Prices" component={GasPriceScreen} />}
          {isFeatureEnabled('car_screen') && <Tab.Screen name="Car" component={CarScreen} />}
        </Tab.Navigator>
      </NavigationContainer>
    </GlobalContext.Provider>
  );
});
