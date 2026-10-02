// React
import React, { useState, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
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

// Styles
import { color, space } from '../../../styles/theme';

interface Props {
  onLogin?: (credential: AuthCredential, refreshToken?: string) => void,
  mode?: 'login' | 'refresh',
}

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.borderStrong,
  },
});

export default function LoginSection({ onLogin, mode = 'login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [, , error] = useAuthState(auth);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validInputs = maybeValidEmail(email) && password.length > 0;

  const login = () => {
    setSubmitting(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log('signed in!');
        setEmailError(false);
        setPasswordError(false);
        if (onLogin) {
          const cred = EmailAuthProvider.credential(email, password);
          onLogin(cred);
        }

        logLogin('email');
      })
      .catch((exception) => {
        let errorMessage = 'An error occurred when trying to log you in. Please try again.';
        if (exception.code === 'auth/wrong-password' || exception.code === 'auth/invalid-credential') {
          errorMessage = 'That email and password don’t match. Please try again.';
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
        Alert('Couldn’t sign in', errorMessage);
      })
      .finally(() => setSubmitting(false));
  };

  if (error) {
    console.log(error);
  }

  const showApple = Platform.OS === 'ios' && isFeatureEnabled('apple_login');

  const passwordRef = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      <Input
        label="Email"
        placeholder="you@example.com"
        onChangeText={setEmail}
        value={email}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        error={emailError}
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef?.current?.focus()}
      />
      <Input
        myRef={passwordRef}
        label="Password"
        placeholder="Your password"
        onChangeText={setPassword}
        value={password}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        password
        error={passwordError}
        onSubmitEditing={() => validInputs && login()}
      />
      <Button
        title={mode === 'refresh' ? 'Confirm' : 'Sign in'}
        fullWidth
        loading={submitting}
        disabled={!validInputs}
        onPress={login}
        style={{ marginTop: space.xs }}
      />
      {showApple && (
        <>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text variant="caption" tone="tertiary">OR</Text>
            <View style={styles.line} />
          </View>
          <AppleLogin onLogin={onLogin} mode={mode} />
        </>
      )}
    </View>
  );
}
