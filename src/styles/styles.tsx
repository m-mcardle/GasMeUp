import { StyleSheet, Appearance } from 'react-native';

export const isDarkMode = Appearance.getColorScheme() === 'dark';

export const colors = {
  primary: isDarkMode ? '#12130F' : '#FFFBFE',
  secondary: isDarkMode ? '#FFFBFE' : '#12130F',
  black: '#12130F',
  white: '#FFFBFE',
  tertiary: '#8FCB9B',
  lightTertiary: '#C7E5CD',
  darkestGray: '#AAAAAA',
  darkGray: '#CCCCCC',
  gray: '#DDDDDD',
  lightGray: '#EEEEEE',
  teal: '#29A8AB',
  green: '#118C4F',
  red: '#DC143C',
};

export const fonts = {
  300: 'Rubik_300Light',
  400: 'Rubik_400Regular',
  500: 'Rubik_500Medium',
  600: 'Rubik_600SemiBold',
  700: 'Rubik_700Bold',
  800: 'Rubik_800ExtraBold',
  900: 'Rubik_900Black',
  i300: 'Rubik_300Light_Italic',
  i400: 'Rubik_400Regular_Italic',
  i500: 'Rubik_500Medium_Italic',
  i600: 'Rubik_600SemiBold_Italic',
  i700: 'Rubik_700Bold_Italic',
  i800: 'Rubik_800ExtraBold_Italic',
  i900: 'Rubik_900Black_Italic',
};

export const font = fonts[400];
export const italicFont = fonts.i400;
export const boldItalicFont = fonts.i700;
export const boldFont = fonts[700];
export const semiBoldFont = fonts[600];

export const globalStyles = StyleSheet.create({
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
    color: colors.black,
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
    backgroundColor: colors.secondary,
    color: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  button: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    color: colors.primary,
    borderWidth: 1,
    borderRadius: 25,
    margin: 10,
    padding: 10,
    paddingHorizontal: 60,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: colors.darkestGray,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
    height: '100%',
  },
  table: {
    height: '70%',
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
  numericInput: {
    fontSize: 12,
    fontFamily: font,
  },
});
