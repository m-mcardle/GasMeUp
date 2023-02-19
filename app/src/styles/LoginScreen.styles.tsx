import { StyleSheet } from 'react-native';

import {
  colors, globalStyles,
} from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    ...globalStyles.centered,
  },
  loginButtonText: {
    color: colors.primary,
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
