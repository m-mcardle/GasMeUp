// React
import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import PropTypes from 'prop-types';

// Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

// Screen
import SignUpScreen from './SignUpScreen';

// Components
import Page from '../components/Page';
import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import AppleLogin from '../components/Login/AppleLogin';

// Helpers
import { maybeValidEmail } from '../helpers/emailHelper';

// Styles
import styles from '../styles/LoginScreen.styles';
import { colors } from '../styles/styles';

interface Props {
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}
function LoginPage({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, , error] = useAuthState(auth);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validInputs = maybeValidEmail(email) && password.length > 0;

  const login = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log('signed in!');
        setEmailError(false);
        setPasswordError(false);
      })
      .catch((exception) => {
        Alert.alert('Error', exception.message);
        if (exception.code === 'auth/wrong-password') {
          setPasswordError(true);
        } else {
          setEmailError(true);
        }
      });
  };

  if (error) {
    console.log(error);
  }

  const platform = Platform.OS;

  const passwordRef = useRef<TextInput>(null);

  return (
    <Page keyboardAvoiding={false}>
      <View style={styles.main}>
        <View style={styles.headingSection}>
          <Text style={styles.h1}>Sign In to GasMeUp</Text>
          <Text style={styles.h2}>To save your trips and split them with your friends!</Text>
        </View>
        <Input
          placeholder="Email"
          onChangeText={setEmail}
          value={email}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          error={emailError}
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef?.current?.focus()}
        />
        <Input
          myRef={passwordRef}
          placeholder="Password"
          onChangeText={setPassword}
          value={password}
          autoComplete="password"
          returnKeyType="done"
          password
          error={passwordError}
          onSubmitEditing={() => validInputs && login()}
        />
        <Button
          disabled={!validInputs}
          onPress={login}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </Button>
        {platform === 'ios' ? <AppleLogin /> : undefined}
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
