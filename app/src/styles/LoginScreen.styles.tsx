import { StyleSheet } from 'react-native';

import {
  colors, globalStyles,
} from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    ...globalStyles.centered,
    paddingBottom: 48,
  },
  loginButtonText: {
    color: colors.white,
    textAlign: 'center',
  },
  navigateSection: {
    flexDirection: 'row',
  },
  headingSection: {
    paddingBottom: 24,
  },
});

export default styles;
