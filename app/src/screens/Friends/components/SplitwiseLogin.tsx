import React, { useEffect } from 'react';
import {
  Alert, Image, Text, View,
} from 'react-native';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Firebase
import {
  doc, updateDoc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../../../firebase';

// Helpers
import { ENV } from '../../../helpers/env';
import { logLogin } from '../../../helpers/analyticsHelper';
import { postData } from '../../../data/data';

// Components
import Button from '../../../components/Button';

// Styles
import {
  boldFont, colors, globalStyles,
} from '../../../styles/styles';

// @ts-ignore
import SplitwiseLogo from '../../../../assets/splitwise-logo.png';

WebBrowser.maybeCompleteAuthSession();

export default function SplitwiseLogin() {
  const [currentUser] = useAuthState(auth);

  const userDoc = currentUser?.uid ? doc(db, 'Users', currentUser.uid) : undefined;
  const secureUserDoc = currentUser?.uid ? doc(db, 'SecureUsers', currentUser.uid) : undefined;

  // The auth.expo.io proxy (`useProxy`) was removed from expo-auth-session.
  // Always redirect back through the app scheme: gas-me-up://redirect
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'gas-me-up',
    path: 'redirect',
  });

  // Only the authorization endpoint is used here: the code -> token exchange
  // happens on our server, which holds the Splitwise consumer secret.
  const discovery = {
    authorizationEndpoint: 'https://secure.splitwise.com/oauth/authorize',
  };

  // Authorization code grant with PKCE (no client secret in the app).
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ENV.SPLITWISE_CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    const exchangeCodeForToken = async (code: string): Promise<string> => {
      const response = await postData('/splitwise/token', {
        code,
        redirect_uri: redirectUri,
        client_id: ENV.SPLITWISE_CLIENT_ID,
        code_verifier: request?.codeVerifier,
      });
      const json = await response.json();
      if (!response.ok || typeof json?.access_token !== 'string') {
        throw new Error(`Splitwise token exchange failed (${response.status}: ${json?.error ?? 'unknown'})`);
      }
      return json.access_token;
    };

    const fetchSplitwiseUser = async (token: string) => {
      const response = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    };

    const code = result?.type === 'success' ? result.params?.code : undefined;
    if (!code) {
      return;
    }

    exchangeCodeForToken(code)
      .then((accessToken) => {
        if (secureUserDoc) {
          updateDoc(secureUserDoc, {
            splitwiseToken: accessToken,
          });
        }

        if (userDoc) {
          fetchSplitwiseUser(accessToken)
            .then(({ user }) => {
              updateDoc(userDoc, {
                splitwiseUID: user.id,
              });
            });
        }

        logLogin('splitwise');
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Splitwise', 'Could not connect your Splitwise account. Please try again.');
      });
  }, [result]);

  return (
    <View style={{ height: '80%', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ ...globalStyles.h1, color: 'white' }}>Connect your Splitwise account</Text>
      <Text style={{ ...globalStyles.h3, color: 'white' }}>Sign in to your Splitwise account to view your friends here</Text>
      <Button
        disabled={!request}
        onPress={() => promptAsync()}
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
