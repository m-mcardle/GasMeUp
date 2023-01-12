import { StyleSheet } from 'react-native';

import { colors } from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    backgroundColor: colors.primary,
    height: '100%',
    paddingVertical: 64,
  },
  table: {
    height: '70%',
    paddingVertical: 48,
  },
  friendInfoTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  friendInfoButtonSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  friendInfoButton: {
    backgroundColor: colors.tertiary,
    padding: 10,
    borderRadius: 5,
  },
});

export default styles;
