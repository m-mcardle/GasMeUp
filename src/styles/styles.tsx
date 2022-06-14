import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#FFFBFE',
  secondary: '#12130F',
  tertiary: '#8FCB9B',
  darkestGray: '#BBBBBB',
  darkGray: '#CCCCCC',
  gray: '#DDDDDD',
  lightGray: '#EEEEEE',
  teal: '#29A8AB',
  black: '#1E1E1E',
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
export const boldFont = fonts[700];
export const semiBoldFont = fonts[600];

export const globalStyles = StyleSheet.create({
  text: {
    fontFamily: font,
    color: colors.secondary,
  },
  input: {
    width: '75%',
    fontFamily: font,
    borderWidth: 1,
    borderRadius: 5,
    margin: 5,
    padding: 10,
    backgroundColor: colors.tertiary,
    fontSize: 10,
  },
  button: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    color: colors.primary,
    borderWidth: 1,
    borderRadius: 25,
    margin: 10,
    padding: 10,
    paddingHorizontal: 30,
  },
});
