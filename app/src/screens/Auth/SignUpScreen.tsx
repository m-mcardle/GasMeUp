// React
import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import md5 from 'md5';

// Firebase
import {
  createUserWithEmailAndPassword, sendEmailVerification, updateProfile,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

// Global State
import { useGlobalState } from '../../hooks/hooks';

// Components
import Page from '../../components/Page';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Text from '../../components/Text';
import Alert from '../../components/Alert';

// Helpers
import { maybeValidEmail } from '../../helpers/emailHelper';
import { logSignUp } from '../../helpers/analyticsHelper';

// Styles
import { space } from '../../styles/theme';

const styles = StyleSheet.create({
  intro: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  form: {
    gap: space.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  legal: {
    marginTop: space.lg,
  },
});

export default function SignUpScreen() {
  const [globalState] = useGlobalState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const signUp = () => {
    setEmailError(false);
    setPasswordError(false);
    setSubmitting(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        console.log('signed up!');

        const { user } = userCredential;

        updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
          photoURL: `https://www.gravatar.com/avatar/${md5(email.toLowerCase())}?d=identicon`,
        });

        await sendEmailVerification(user);

        Alert('Welcome!', `A verification email has been sent to ${email}. You must verify your account before you can save any trips!`);

        setDoc(doc(db, 'Users', user.uid), {
          uid: user.uid,
          email,
          firstName,
          lastName,
          transactions: [],
          friends: {},
          notificationToken: globalState.expoToken ?? '',
        })
          .then(() => {
            console.log('Created `Users` document');
          });

        setDoc(doc(db, 'SecureUsers', user.uid), {
          uid: user.uid,
        })
          .then(() => {
            console.log('Created `SecureUsers` document');
          });

        console.log('All done!');
        logSignUp('email');
      })
      .catch((exception) => {
        let errorMessage = 'An error occurred when trying to log you in. Please try again.';
        if (exception.code === 'auth/weak-password') {
          errorMessage = 'Password must be at least 6 characters. Please try again.';
          setPasswordError(true);
        } else if (exception.code === 'auth/email-already-in-use') {
          errorMessage = 'The email you entered is already associated with an account. Please try and sign in with your existing account.';
          setEmailError(true);
        } else if (exception.code === 'auth/invalid-email') {
          errorMessage = 'The email you entered is not valid. Please try again.';
          setEmailError(true);
        } else if (exception.code === 'auth/too-many-requests') {
          errorMessage = 'You have tried to log in too many times. Please try again later.';
        }
        Alert('Couldn\u2019t create your account', errorMessage);
      })
      .finally(() => setSubmitting(false));
  };

  const invalidInputs = !firstName || !lastName || !maybeValidEmail(email) || !password;

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  return (
    <Page scroll safeTop={false}>
      <View style={styles.intro}>
        <Text variant="title2">Join GasMeUp</Text>
        <Text variant="subhead" tone="secondary" style={{ marginTop: space.xs }}>
          Save your trips and split the gas with friends.
        </Text>
      </View>
      <View style={styles.form}>
        <View style={styles.nameRow}>
          <Input
            viewStyle={{ flex: 1 }}
            label="First name"
            placeholder="Alex"
            onChangeText={setFirstName}
            value={firstName}
            returnKeyType="next"
            autoComplete="name-given"
            textContentType="givenName"
            autoCapitalize="words"
            blurOnSubmit={false}
            onSubmitEditing={() => lastNameRef?.current?.focus()}
          />
          <Input
            viewStyle={{ flex: 1 }}
            myRef={lastNameRef}
            label="Last name"
            placeholder="Rivera"
            onChangeText={setLastName}
            value={lastName}
            returnKeyType="next"
            autoComplete="name-family"
            textContentType="familyName"
            autoCapitalize="words"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef?.current?.focus()}
          />
        </View>
        <Input
          myRef={emailRef}
          label="Email"
          placeholder="you@example.com"
          error={emailError}
          onChangeText={setEmail}
          value={email}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef?.current?.focus()}
        />
        <Input
          myRef={passwordRef}
          label="Password"
          placeholder="At least 6 characters"
          helperText={passwordError ? 'Password must be at least 6 characters.' : undefined}
          error={passwordError}
          onChangeText={setPassword}
          value={password}
          password
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => !invalidInputs && signUp()}
        />
        <Button
          title="Create account"
          fullWidth
          loading={submitting}
          disabled={invalidInputs}
          onPress={() => signUp()}
          style={{ marginTop: space.xs }}
        />
      </View>
      <Text variant="footnote" tone="tertiary" align="center" style={styles.legal}>
        We’ll email you a link to verify your account before you can save trips.
      </Text>
    </Page>
  );
}
