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
  selectionButtons: {
    marginTop: 'auto',
    marginBottom: 16,
    width: '80%',
  },
  gasPriceTable: {
    width: '100%',
    marginTop: 8,
    height: '75%',
  },
});

export default styles;
