import { StyleSheet } from 'react-native';

import { boldFont, colors } from './styles';

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
    paddingHorizontal: 24,
  },
  settingContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: colors.softBlack,
  },
  settingsText: {
    textAlign: 'right',
    fontSize: 12,
    padding: 4,
    width: '45%',
    fontFamily: boldFont,
  },
  settingValueText: {
    textAlign: 'left',
    fontSize: 10,
    padding: 4,
    width: '100%',
    borderRadius: 5,
    borderColor: colors.secondary,
  },
  settingItem: {
    width: '55%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
    backgroundColor: colors.softBlack,
    borderColor: colors.secondary,
  },
  settingGroup: {
    borderWidth: 1,
    borderColor: 'white',
    margin: 8,
  },
  settingHeader: {
    width: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: boldFont,
  },
});

export default styles;
