import { StyleSheet } from 'react-native';

import {
  boldFont,
} from './styles';

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: 50,
    fontFamily: boldFont,
  },
  main: {
    flex: 1,
    height: '100%',
    paddingTop: 8,
    alignItems: 'center',
  },
});

export default styles;
