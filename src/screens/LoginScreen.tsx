import React, { useState } from 'react';
import { TouchableOpacity, View, Alert } from 'react-native';
import PropTypes from 'prop-types';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import { createStackNavigator } from '@react-navigation/stack';

import { auth } from '../../firebase';

import SignUpScreen from './SignUpScreen';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors, globalStyles } from '../styles/styles';

const login = (email: string, password: string) => {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log('signed in!');
    })
    .catch((exception) => {
      Alert.alert('Error', exception.message);
    });
};

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

  if (error) {
    console.log(error);
  }

  return (
    <View style={globalStyles.centered}>
      <Input
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
      />
      <Input
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        password
      />
      <Button onPress={() => login(email, password)}>
        <Text style={{ color: colors.primary, textAlign: 'center' }}>Login</Text>
      </Button>
      <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => navigation.navigate('Sign Up')}>
        <Text>Need an account?</Text>
        <Text style={{ textDecorationLine: 'underline' }}> Sign up here!</Text>
      </TouchableOpacity>
    </View>
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
    <RootStack.Navigator>
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginPage} />
      </RootStack.Group>
      <RootStack.Group>
        <RootStack.Screen name="Sign Up" component={SignUpScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
