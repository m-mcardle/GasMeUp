import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '../../firebase';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors } from '../styles/styles';
import styles from '../styles/FriendsScreen.styles';

const login = (email: string, password: string) => {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log('signed in!');
    });
};

interface Props {
  navigation: {
    navigate: (str: string) => {},
    goBack: () => {}
  },
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, loading, error] = useAuthState(auth);

  if (error) {
    console.log(error);
  }

  useEffect(() => {
    if (user && !loading) {
      navigation.goBack();
    }
  }, [user, loading]);

  return (
    <View style={styles.main}>
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

LoginScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
