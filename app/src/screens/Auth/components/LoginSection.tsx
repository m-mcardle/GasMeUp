// React
import React, { useState, useRef } from 'react';
import {
  Platform,
  TextInput,
} from 'react-native';

// Firebase
import { AuthCredential, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../firebase';

// Components
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Text from '../../../components/Text';
import Alert from '../../../components/Alert';

import AppleLogin from './AppleLogin';

// Helpers
import { maybeValidEmail } from '../../../helpers/emailHelper';
import { logLogin } from '../../../helpers/analyticsHelper';
import { isFeatureEnabled } from '../../../helpers/featureHelper';
import { loginBillingUser } from '../../../helpers/billingHelper';

// Styles
import styles from '../../../styles/LoginScreen.styles';

interface Props {
  onLogin?: (credential: AuthCredential, refreshToken?: string) => void,
  mode?: 'login' | 'refresh',
}

export default function LoginSection({ onLogin, mode = 'login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, , error] = useAuthState(auth);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validInputs = maybeValidEmail(email) && password.length > 0;

  const login = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('signed in!');
        setEmailError(false);
        setPasswordError(false);
        if (onLogin) {
          const cred = EmailAuthProvider.credential(email, password);
          onLogin(cred);
        }

        logLogin('email');

        loginBillingUser(userCredential.user);
      })
      .catch((exception) => {
        let errorMessage = 'An error occurred when trying to log you in. Please try again.';
        if (exception.code === 'auth/wrong-password') {
          errorMessage = 'The password you entered is incorrect. Please try again.';
          setPasswordError(true);
        } else if (exception.code === 'auth/user-not-found') {
          errorMessage = 'The email you entered is not associated with an account. Please try again.';
          setEmailError(true);
        } else if (exception.code === 'auth/invalid-email') {
          errorMessage = 'The email you entered is not valid. Please try again.';
          setEmailError(true);
        } else if (exception.code === 'auth/too-many-requests') {
          errorMessage = 'You have tried to log in too many times. Please try again later.';
        }
        Alert('Error', errorMessage);
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
      {platform === 'ios' && isFeatureEnabled('apple_login') ? <AppleLogin onLogin={onLogin} mode={mode} /> : undefined}
    </>
  );
}
