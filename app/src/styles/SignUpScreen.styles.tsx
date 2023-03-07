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
    ...globalStyles.centeredHorizontal,
    paddingTop: 20,
    paddingBottom: 120,
  },
  signUpButtonText: {
    color: colors.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 10,
    color: colors.red,
  },
  headingSection: {
    paddingBottom: 24,
  },
});

export default styles;
