import { StyleSheet } from 'react-native';

import { colors } from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    height: '100%',
    paddingTop: 32,
    paddingBottom: 64,
  },
  table: {
    flex: 1,
    paddingVertical: 48,
  },
  friendInfoTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  friendInfoButtonSection: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 'auto',
  },
  friendInfoButton: {
    backgroundColor: colors.action,
    padding: 10,
    borderRadius: 5,
  },
});

export default styles;
