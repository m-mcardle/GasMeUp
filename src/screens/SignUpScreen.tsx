// React
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import PropTypes from 'prop-types';

// Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// Components
import Page from '../components/Page';
import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

// Styles
import styles from '../styles/SignUpScreen.styles';

interface Props {
  navigation: {
    goBack: () => {}
  },
}

export default function SignUpScreen({ navigation }: Props) {
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
      .then((userCredential) => {
        console.log('signed up!');

        const { user } = userCredential;

        setDoc(doc(db, 'Users', user.uid), {
          uid: user.uid,
          email,
          firstName,
          lastName,
          transactions: [],
          friends: {},
        })
          .then(() => {
            console.log('All done!');
            navigation.goBack();
          });
      })
      .catch((exception) => {
        Alert.alert('Error', exception.message);
        if (exception.code === 'auth/invalid-email') {
          setEmailError(true);
        } else if (exception.code === 'auth/weak-password') {
          setPasswordError(true);
        }
      });
  };

  return (
    <Page>
      <View style={styles.main}>
        <View style={styles.headingSection}>
          <Text style={styles.h1}>Join GasMeUp</Text>
          <Text style={styles.h2}>To save your trips and split them with your friends!</Text>
        </View>
        <Input
          placeholder="First Name"
          onChangeText={setFirstName}
          value={firstName}
        />
        <Input
          placeholder="Last Name"
          onChangeText={setLastName}
          value={lastName}
        />
        {emailError && <Text style={styles.errorText}>Invalid email</Text>}
        <Input
          placeholder="Email"
          error={emailError}
          onChangeText={setEmail}
          value={email}
        />
        {passwordError && <Text style={styles.errorText}>Password is too weak</Text>}
        <Input
          placeholder="Password"
          error={passwordError}
          onChangeText={setPassword}
          value={password}
          password
        />
        <Button
          disabled={!firstName || !lastName || !email || !password}
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
