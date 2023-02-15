import * as AppleAuthentication from 'expo-apple-authentication';
import { View, Alert } from 'react-native';

import md5 from 'md5';

import { signInWithCredential, OAuthProvider, updateProfile } from 'firebase/auth';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

import { isDarkMode } from '../../styles/styles';

export default function AppleLogin() {
  const signInWithApple = async () => {
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const nonce = Math.random().toString(36).substring(2, 10);
      const { identityToken } = appleCredential;

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken!,
        rawNonce: nonce,
      });

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
              incomingFriendRequests: [],
              outgoingFriendRequests: [],
              appleUser: true,
            })
              .then(() => {
                console.log('All done! Created user!');
              });
          }
        })
        .catch((exception) => {
          Alert.alert('Error', exception.message);
        });
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
