import { StyleSheet } from 'react-native';

import {
  colors, boldFont, // semiBoldFont, font,
} from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    flex: 2,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 3,
    alignItems: 'center',
  },
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
  },
  title: {
    fontSize: 50,
    fontFamily: boldFont,
  },
  settingsText: {
    textAlign: 'right',
    fontSize: 16,
    padding: 4,
    width: '60%',
  },
  settingsSwitch: {
    width: '40%',
  },
});

export default styles;
