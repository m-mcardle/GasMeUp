// Expo imports
import Ionicons from '@expo/vector-icons/Ionicons';

// React imports
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => TabIcon(
            {
              name: route.name,
              focused,
              color,
              size,
            },
          ),
          headerShown: false,
          tabBarActiveTintColor: colors.tertiary,
          tabBarInactiveTintColor: colors.secondary,
        })}
      >
        <Tab.Screen name="Friends" component={SettingsScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
