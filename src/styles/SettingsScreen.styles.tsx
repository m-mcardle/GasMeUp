import { StyleSheet } from 'react-native';

import { colors } from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    flex: 2,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  mainContainer: {
    flex: 3,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  settingContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 8,
  },
  settingsText: {
    textAlign: 'right',
    fontSize: 16,
    padding: 4,
    width: '50%',
  },
  settingItem: {
    width: '40%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
  },
});

export default styles;
