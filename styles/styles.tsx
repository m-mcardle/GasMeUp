import { StyleSheet } from "react-native";

export const colors = {
  primary: '#CCCCCC',
  secondary: '#DDDDDD',
  tertiary: '#29A8AB',
  darkestGray: '#BBBBBB',
  darkGray: '#CCCCCC',
  gray: '#DDDDDD',
  lightGray: '#EEEEEE',
  teal: '#29A8AB',
  black: '#1E1E1E',
  green: '#118C4F',
  red: '#DC143C'
}

export const font = 'Gotham-Black'
export const italicFont = 'Gotham-ThinItalic'

export const globalStyles = StyleSheet.create({
  text: {
    fontFamily: font,
    color: colors.black
  },
  input: {
    width: '70%',
    fontFamily: font,
    borderWidth: 1,
    borderRadius: 5,
    margin: 5,
    padding: 5,
    backgroundColor: colors.lightGray,
    fontSize: 10
  },
  button: {
    backgroundColor: colors.tertiary,
    borderRadius: 5,
    margin: 10,
    padding: 5,
    paddingHorizontal: 20,
  }
});
