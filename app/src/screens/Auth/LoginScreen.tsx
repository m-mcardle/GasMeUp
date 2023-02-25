// React
import React from 'react';
import {
  TouchableOpacity,
  View,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import PropTypes from 'prop-types';

// Screen
import SignUpScreen from './SignUpScreen';

// Components
import Page from '../../components/Page';
import Text from '../../components/Text';

import LoginSection from '../../components/Login/LoginSection';

// Styles
import styles from '../../styles/LoginScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

interface Props {
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

function LoginPage({ navigation }: Props) {
  return (
    <Page keyboardAvoiding={false}>
      <View style={styles.main}>
        <View style={styles.headingSection}>
          <Text style={globalStyles.h1}>Sign In to GasMeUp</Text>
          <Text style={globalStyles.h3}>To save your trips and split them with your friends!</Text>
        </View>
        <LoginSection />
        <TouchableOpacity style={styles.navigateSection} onPress={() => navigation.navigate('Sign Up')}>
          <Text>Need an account?</Text>
          <Text style={{ textDecorationLine: 'underline' }}> Sign up here!</Text>
        </TouchableOpacity>
      </View>
    </Page>
  );
}

LoginPage.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

const RootStack = createStackNavigator();

export default function LoginScreen() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.purple,
          height: 80,
        },
        headerTitleStyle: { color: colors.white },
      }}
    >
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginPage} />
      </RootStack.Group>
      <RootStack.Group>
        <RootStack.Screen name="Sign Up" component={SignUpScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
