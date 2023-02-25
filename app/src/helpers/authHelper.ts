import { Alert } from 'react-native';

import { User } from 'firebase/auth';

export function validateCurrentUserEmail(user: User) {
  if (!user.emailVerified) {
    user.reload();
    Alert.alert('Email Not Verified', 'You must verify your email before you can do that');
    return false;
  }

  return true;
}

export function validateCurrentUserSignedIn(user: User | null | undefined) {
  if (!user) {
    Alert.alert('Please Log In', 'You must log in before you can do that');
    return false;
  }

  return true;
}

export function validateCurrentUser(user: User | null | undefined) {
  return validateCurrentUserSignedIn(user) && validateCurrentUserEmail(user!);
}

export default {
  validateCurrentUser,
  validateCurrentUserEmail,
  validateCurrentUserSignedIn,
};
