// React
import React, { useState, useRef } from 'react';
import { View, TextInput } from 'react-native';
import PropTypes from 'prop-types';

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
import { loginBillingUser } from '../../helpers/billingHelper';

// Styles
import styles from '../../styles/SignUpScreen.styles';
import { globalStyles } from '../../styles/styles';

export default function SignUpScreen() {
  const [globalState] = useGlobalState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const signUp = () => {
    setEmailError(false);
    setPasswordError(false);
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

        loginBillingUser(user);
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
        Alert('Error', errorMessage);
      });
  };

  const invalidInputs = !firstName || !lastName || !maybeValidEmail(email) || !password;

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  return (
    <Page keyboardAvoiding={false}>
      <View style={styles.main}>
        <View style={styles.headingSection}>
          <Text style={globalStyles.h1}>Join GasMeUp</Text>
          <Text style={globalStyles.h2}>To save your trips and split them with your friends!</Text>
        </View>
        <Input
          placeholder="First Name"
          onChangeText={setFirstName}
          value={firstName}
          returnKeyType="next"
          autoComplete="name-given"
          onSubmitEditing={() => lastNameRef?.current?.focus()}
        />
        <Input
          myRef={lastNameRef}
          placeholder="Last Name"
          onChangeText={setLastName}
          value={lastName}
          returnKeyType="next"
          autoComplete="name-family"
          onSubmitEditing={() => emailRef?.current?.focus()}
        />
        <Input
          myRef={emailRef}
          placeholder="Email"
          error={emailError}
          onChangeText={setEmail}
          value={email}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef?.current?.focus()}
        />
        <Input
          myRef={passwordRef}
          placeholder="Password"
          error={passwordError}
          onChangeText={setPassword}
          value={password}
          password
          autoComplete="password-new"
          returnKeyType="done"
          onSubmitEditing={() => !invalidInputs && signUp()}
        />
        <Button
          disabled={invalidInputs}
          onPress={() => signUp()}
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </Button>
      </View>
    </Page>
  );
}

SignUpScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
