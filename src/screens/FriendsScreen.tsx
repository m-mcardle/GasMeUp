import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';

import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection, doc, query, where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import { DataTable } from 'react-native-paper';

import { createStackNavigator } from '@react-navigation/stack';

import { auth, db } from '../../firebase';

import SignUpScreen from './SignUpScreen';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors } from '../styles/styles';
import styles from '../styles/FriendsScreen.styles';

const usersRef = collection(db, 'Users');

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

interface Props {
  navigation: {
    navigate: (str: string) => {}
  },
}

function FriendsPage({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, loading, error] = useAuthState(auth);

  const userDoc = user?.uid ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const balances = userDocument ? userDocument.friends : undefined;
  const friendsUIDs = balances ? Object.keys(balances) : undefined;

  const friendsQuery = friendsUIDs?.length ? query(usersRef, where('__name__', 'in', friendsUIDs)) : undefined;
  const [friendsData, , errorFriendsDB] = useCollectionData(friendsQuery);

  const formattedBalances = friendsData ? friendsUIDs?.map((uid: string) => {
    const currentFriend = friendsData?.find((friend) => friend.uid === uid);
    return {
      name: `${currentFriend?.firstName} ${currentFriend?.lastName}`, amount: balances[uid],
    };
  }) : undefined;

  if (errorUserDB || errorFriendsDB || error) {
    console.log(errorUserDB, errorFriendsDB, error);
  }
  return (
    <View>
      {
        user && !loading && !error
          ? (
            <View style={styles.main}>
              <DataTable>

                <DataTable.Header>
                  <DataTable.Title>Friend</DataTable.Title>
                  <DataTable.Title numeric>Amount Owed</DataTable.Title>
                </DataTable.Header>

                {
                  formattedBalances?.map((balance) => (
                    <DataTable.Row key={balance.name}>
                      <DataTable.Cell>{balance.name}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        $
                        {balance.amount}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                }

                <DataTable.Pagination
                  page={0}
                  numberOfPages={2}
                  onPageChange={() => {}}
                  label="1-4 of 4"
                  selectPageDropdownLabel="Rows per page"
                />

              </DataTable>
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
              <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => navigation.navigate('Sign Up')}>
                <Text>Need an account?</Text>
                <Text style={{ textDecorationLine: 'underline' }}> Sign up here!</Text>
              </TouchableOpacity>
            </View>
          )
      }
    </View>
  );
}

FriendsPage.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const RootStack = createStackNavigator();

export default function FriendsScreen() {
  return (
    <RootStack.Navigator>
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Friends Page" component={FriendsPage} />
      </RootStack.Group>
      <RootStack.Group>
        <RootStack.Screen name="Sign Up" component={SignUpScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
