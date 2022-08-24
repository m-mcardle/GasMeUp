import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import PropTypes from 'prop-types';

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  setDoc, getFirestore, doc,
} from 'firebase/firestore';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors } from '../styles/styles';
import styles from '../styles/FriendsScreen.styles';

const auth = getAuth();
const db = getFirestore();

interface Props {
  navigation: {
    goBack: () => {}
  },
}

export default function SignUpScreen({ navigation }: Props) {
  const signUp = (email: string, password: string, firstName: string, lastName: string) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('signed up!');

        const { user } = userCredential;

        setDoc(doc(db, 'Users', user.uid), {
          uid: user.uid,
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
        Alert.alert(exception);
      });
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <View>
      <View style={styles.main}>
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
        <Button
          disabled={!firstName || !lastName || !email || !password}
          onPress={() => signUp(email, password, firstName, lastName)}
        >
          <Text style={{ color: colors.primary, textAlign: 'center' }}>Sign Up</Text>
        </Button>
      </View>
    </View>
  );
}

SignUpScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
