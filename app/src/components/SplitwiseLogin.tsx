import React, { useEffect } from 'react';
import { Button, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { changeSetting, useGlobalState } from '../hooks/hooks';

import { ENV } from '../helpers/env';

WebBrowser.maybeCompleteAuthSession();

export default function SplitwiseLogin() {
  const [globalState, updateGlobalState] = useGlobalState();
  const useProxy = true;
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy,
  });

  console.log(redirectUri);
  const discovery = {
    authorizationEndpoint: 'https://secure.splitwise.com/oauth/authorize',
    tokenEndpoint: 'https://secure.splitwise.com/oauth/token',
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
    if (result?.type === 'success' && result?.authentication?.accessToken) {
      changeSetting('splitwiseToken', result.authentication.accessToken, updateGlobalState);
    }
  }, [result]);

  console.log(globalState.splitwiseToken);
  return (
    <View style={{ height: '10%', justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Login!" disabled={!request} onPress={() => promptAsync({ useProxy })} />
      {result && <Text style={{ color: 'white' }}>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}
