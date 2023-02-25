import * as AppleAuthentication from 'expo-apple-authentication';
import { View, Alert } from 'react-native';

import md5 from 'md5';

import {
  AuthCredential, signInWithCredential, OAuthProvider, updateProfile,
} from 'firebase/auth';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

import { DEV } from '../../helpers/env';

import { isDarkMode } from '../../styles/styles';

interface Props {
  onLogin?: (credential: AuthCredential, refreshToken?: string) => void,
  mode?: 'login' | 'refresh',
}

export default function AppleLogin({ onLogin, mode = 'login' }: Props) {
  const signInWithApple = async () => {
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const nonce = Math.random().toString(36).substring(2, 10);
      const { identityToken, authorizationCode } = appleCredential;

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken!,
        rawNonce: nonce,
      });

      let refreshToken: string | undefined;
      if (!DEV && mode === 'refresh') {
        const response = await fetch(`https://us-central1-gasmeup-7ce5f.cloudfunctions.net/getRefreshToken?code=${authorizationCode}`);
        refreshToken = await response.text();
        console.log('Apple refresh token:', refreshToken);

        if (onLogin) {
          onLogin(credential, refreshToken);
        }
        return;
      }

      if (mode === 'login') {
        signInWithCredential(auth, credential)
          .then(async (firebaseCredential) => {
            console.log('signed in!');

            const { user } = firebaseCredential;
            const firstName = appleCredential.fullName?.givenName ?? 'Unknown';
            const lastName = appleCredential.fullName?.familyName ?? 'Unknown';
            const email = appleCredential.email ?? 'Unknown';
            const { uid } = user;

            const userDocument = await getDoc(doc(db, 'Users', uid));

            if (!userDocument.exists()) {
              await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
                photoURL: `https://www.gravatar.com/avatar/${md5(email.toLowerCase())}?d=identicon`,
              });

              setDoc(doc(db, 'Users', user.uid), {
                uid: user.uid,
                email,
                firstName,
                lastName,
                transactions: [],
                friends: {},
                appleUser: true,
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
            }
            if (onLogin) {
              onLogin(credential);
            }
          })
          .catch((exception) => {
            Alert.alert('Error', exception.message);
          });
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  };

  return (
    <View style={{ paddingBottom: 4 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={isDarkMode
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 140, height: 30 }}
        onPress={signInWithApple}
      />
    </View>
  );
}

AppleLogin.defaultProps = {
  onLogin: undefined,
  mode: 'login',
};
