import { StyleSheet, Appearance } from 'react-native';

// TODO - Renenable light mode
export const isDarkMode = Appearance.getColorScheme() === 'dark' || true;

export const colors = {
  primary: isDarkMode ? '#12130F' : '#FFFBFE',
  secondary: isDarkMode ? '#FFFBFE' : '#12130F',
  black: '#12130F',
  white: '#FFFBFE',
  tertiary: '#1b1c2c',
  lightTertiary: '#5F606B',
  darkestGray: '#444444',
  darkGray: '#CCCCCC',
  gray: '#DDDDDD',
  lightGray: '#EEEEEE',
  teal: '#29A8AB',
  green: '#118C4F',
  darkGreen: '#1f584e',
  red: '#DC143C',
  test: '#1BC3B9',
  secondaryAction: '#B44E8F',
  purple: '#22133c',
  action: '#6f61fe',
};

export const fonts = {
  300: 'Inter_300Light',
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
  800: 'Inter_800ExtraBold',
  900: 'Inter_900Black',
};

export const font = fonts[400];
export const boldFont = fonts[700];
export const semiBoldFont = fonts[600];

export const globalStyles = StyleSheet.create({
  page: {
    flex: 1,
    paddingVertical: 20,
  },
  text: {
    fontFamily: font,
    color: colors.secondary,
  },
  input: {
    fontFamily: font,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
    padding: 10,
    backgroundColor: colors.tertiary,
    color: colors.white,
    fontSize: 10,
  },
  inputView: {
    width: '75%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearInputButton: {
    width: 20,
    height: 20,
    backgroundColor: colors.action,
    color: colors.secondary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  button: {
    backgroundColor: colors.action,
    borderColor: colors.primary,
    color: colors.secondary,
    borderWidth: 1,
    borderRadius: 25,
    margin: 10,
    padding: 10,
    paddingHorizontal: 60,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: colors.darkestGray,
    color: colors.secondary,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
    height: '100%',
  },
  table: {
    height: '100%',
  },
  modal: {
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.secondary,
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: boldFont,
    textAlign: 'center',
    padding: 10,
  },
  smallText: {
    fontSize: 10,
    fontFamily: font,
    color: colors.secondary,
  },
  errorInput: {
    borderWidth: 2,
    borderColor: colors.red,
  },
  numericInput: {
    fontSize: 12,
    fontFamily: font,
  },
});
