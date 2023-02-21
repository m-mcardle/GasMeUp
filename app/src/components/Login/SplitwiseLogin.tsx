import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Firebase
import {
  doc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../../firebase';

// Helpers
import { ENV } from '../../helpers/env';

// Components
import Button from '../Button';

// Styles
import {
  boldFont, colors, globalStyles,
} from '../../styles/styles';

// @ts-ignore
import SplitwiseLogo from '../../../assets/splitwise-logo.png';

WebBrowser.maybeCompleteAuthSession();

export default function SplitwiseLogin() {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const secureUserDoc = currentUser?.uid ? doc(db, 'SecureUsers', currentUser.uid) : undefined;

  const useProxy = true;
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy,
  });

  const discovery = {
    authorizationEndpoint: 'https://secure.splitwise.com/oauth/authorize',
    tokenEndpoint: 'https://secure.splitwise.com/oauth/token',
    revocationEndpoint: 'https://secure.splitwise.com/oauth/revoke',
    useProxy,
  };

  // Create and load an auth request
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ENV.SPLITWISE_CLIENT_ID,
      clientSecret: ENV.SPLITWISE_CONSUMER_SECRET,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    discovery,
  );

  useEffect(() => {
    const fetchSplitwiseUser = async (token: string) => {
      const response = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    };

    if (result?.type === 'success' && result?.authentication?.accessToken) {
      if (secureUserDoc) {
        updateDoc(secureUserDoc, {
          splitwiseToken: result.authentication.accessToken,
        });
      }

      if (userDoc) {
        fetchSplitwiseUser(result.authentication.accessToken)
          .then(({ user }) => {
            updateDoc(userDoc, {
              splitwiseUID: user.id,
            });
          });
      }
    }
  }, [result]);

  return (
    <View style={{ height: '80%', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ ...globalStyles.h1, color: 'white' }}>Please Sign in!</Text>
      <Text style={{ ...globalStyles.h3, color: 'white' }}>Sign in to your Splitwise account to view your friends here</Text>
      <Button
        disabled={!request}
        onPress={() => promptAsync({ useProxy })}
        style={{
          backgroundColor: colors.splitwiseGreen,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontFamily: boldFont }}>Sign In</Text>
        <Image source={SplitwiseLogo} style={{ width: 24, height: 24 }} />
      </Button>
    </View>
  );
}
