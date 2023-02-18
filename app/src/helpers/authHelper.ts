import { Alert } from 'react-native';

import { User } from 'firebase/auth';

export function validateCurrentUser(user: User | null | undefined) {
  if (!user) {
    Alert.alert('Please Log In', 'You must log in before you can do that');
    return false;
  }

  if (!user.emailVerified) {
    user.reload();
    Alert.alert('Email Not Verified', 'You must verify your email before you can do that');
    return false;
  }

  return true;
}

export default {
  validateCurrentUser,
};
