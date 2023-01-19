import * as AppleAuthentication from 'expo-apple-authentication';
import { View, Alert } from 'react-native';

import { signInWithCredential, OAuthProvider } from 'firebase/auth';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

export default function AppleLogin() {
  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 160, height: 45 }}
        onPress={async () => {
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
                const { email, uid } = user;

                const userDocument = await getDoc(doc(db, 'Users', uid));
                if (!userDocument.exists()) {
                  setDoc(doc(db, 'Users', user.uid), {
                    uid: user.uid,
                    email,
                    firstName,
                    lastName,
                    transactions: [],
                    friends: {},
                  })
                    .then(() => {
                      console.log('All done! Created user!');
                    });
                }
              })
              .catch((exception) => {
                Alert.alert('Error', exception.message);
              });
            // signed in
          } catch (e: any) {
            if (e.code === 'ERR_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
    </View>
  );
}
