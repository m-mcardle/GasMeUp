import React, { useState } from 'react';
import { View } from 'react-native';

import { getAuth, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection, doc, getFirestore, query, where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import { DataTable } from 'react-native-paper';

import Button from '../components/Button';
import Input from '../components/Input';
import Text from '../components/Text';

import { colors } from '../styles/styles';
import styles from '../styles/FriendsScreen.styles';

const auth = getAuth();
const db = getFirestore();

const transactionsRef = collection(db, 'Transactions');

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

  const userDoc = user ? doc(db, 'Users', user.uid) : undefined;
  const [userDocument, , errorUserDB] = useDocumentData(userDoc);

  const transactionQuery = userDocument ? query(transactionsRef, where('__name__', 'in', userDocument.transactions)) : undefined;
  const [transactionDocuments, , errorTransactionDB] = useCollectionData(transactionQuery);

  if (errorUserDB || errorTransactionDB || error) {
    console.log(errorUserDB, errorTransactionDB, error);
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
                  transactionDocuments?.map((document) => (
                    <DataTable.Row key={document.amount}>
                      <DataTable.Cell>{document.payeeName}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        $
                        {document.amount}
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
            </View>
          )
      }
    </View>
  );
}
