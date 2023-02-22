// React
import React, { useState, useRef } from 'react';
import {
  Alert,
  Platform,
  TextInput,
} from 'react-native';

// Firebase
import { AuthCredential, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

// Components
import Button from '../Button';
import Input from '../Input';
import Text from '../Text';

import AppleLogin from './AppleLogin';

// Helpers
import { maybeValidEmail } from '../../helpers/emailHelper';

// Styles
import styles from '../../styles/LoginScreen.styles';

interface Props {
  onLogin?: (credential: AuthCredential) => void,
}

export default function LoginSection({ onLogin }: Props) {
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
        if (onLogin) {
          const cred = EmailAuthProvider.credential(email, password);
          onLogin(cred);
        }
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
    <>
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
      {platform === 'ios' ? <AppleLogin onLogin={onLogin} /> : undefined}
    </>
  );
}

LoginSection.defaultProps = {
  onLogin: undefined,
};
