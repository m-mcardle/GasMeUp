import React, { useState } from 'react';
import { View } from 'react-native';

import { getAuth, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors } from '../styles/styles';
import styles from '../styles/FriendsScreen.styles';

const auth = getAuth();

const login = (email: string, password: string) => {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log('signed in!');
    });
};

const logout = () => {
  signOut(auth)
    .then(() => {
      console.log('signed out!');
    });
};

export default function FriendsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, loading, error] = useAuthState(auth);

  return (
    <View>
      {
        user && !loading && !error
          ? (
            <View style={styles.main}>
              <Button onPress={logout}>
                <Text style={{ color: colors.primary, textAlign: 'center' }}>Log Out</Text>
              </Button>
            </View>
          )
          : (
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
            </View>
          )
      }
    </View>
  );
}
