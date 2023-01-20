import { StyleSheet } from 'react-native';

import {
  colors, globalStyles,
} from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    ...globalStyles.centered,
    backgroundColor: colors.primary,
  },
  loginButtonText: {
    color: colors.primary,
    textAlign: 'center',
  },
  navigateSection: {
    flexDirection: 'row',
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
