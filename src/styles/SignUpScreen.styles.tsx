import { StyleSheet } from 'react-native';

import {
  colors, globalStyles,
} from './styles';

// Styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  main: {
    ...globalStyles.centered,
  },
  signUpButtonText: {
    color: colors.primary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 10,
    color: colors.red,
  },
  h1: {
    fontSize: 24,
    textAlign: 'center',
  },
  h2: {
    fontSize: 10,
    textAlign: 'center',
  },
  headingSection: {
    paddingBottom: 24,
  },
});

export default styles;
