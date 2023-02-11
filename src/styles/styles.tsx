import { StyleSheet, Appearance } from 'react-native';

// TODO - Renenable light mode
export const isDarkMode = Appearance.getColorScheme() === 'dark' || true;

export const colors = {
  primary: isDarkMode ? '#12130F' : '#FFFBFE',
  secondary: isDarkMode ? '#FFFBFE' : '#12130F',
  black: '#12130F',
  softBlack: '#1C1D1A',
  white: '#FFFBFE',
  tertiary: '#1b1c2c',
  lightTertiary: '#5F606B',
  darkestGray: '#444444',
  darkGray: '#888888',
  gray: '#bcbcbc',
  lightGray: '#EEEEEE',
  teal: '#29A8AB',
  green: '#118C4F',
  darkGreen: '#1f584e',
  red: '#DC143C',
  secondaryAction: '#7851a9',
  purple: '#22133c',
  action: '#603fef',
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
  suggestionInput: {
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
    padding: 10,
    backgroundColor: colors.tertiary,
  },
  input: {
    fontFamily: font,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
    padding: 10,
    backgroundColor: colors.tertiary,
    color: colors.white,
    fontSize: 14,
  },
  autocompleteContainer: {
    // 12.5 + 12.5 makes it take up 75% of the screen
    left: '12.5%',
    right: '12.5%',
    position: 'absolute',
    top: 10,
  },
  inputView: {
    width: '75%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autocompleteInputView: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 60,
  },
  autocompleteListContainer: {
    backgroundColor: colors.tertiary,
    maxHeight: 300,
    width: '100%',
  },
  autocompleteNestedContainer: {
    width: '100%',
    justifyContent: 'center',
    alignContent: 'center',
  },
  inputItem: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    marginHorizontal: 5,
    paddingVertical: 10,
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
    maxHeight: '100%',
  },
  modal: {
    height: '90%',
    backgroundColor: colors.softBlack,
    borderWidth: 4,
    borderColor: colors.secondary,
    margin: 24,
  },
  title: {
    fontSize: 42,
    fontFamily: boldFont,
    textAlign: 'center',
    padding: 10,
  },
  h1: {
    fontSize: 24,
    textAlign: 'center',
  },
  h2: {
    fontSize: 10,
    textAlign: 'center',
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
    fontSize: 16,
    fontFamily: font,
  },
});
