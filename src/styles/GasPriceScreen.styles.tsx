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
    paddingTop: 24,
    alignItems: 'center',
  },
  selectionButtons: {
    marginTop: 'auto',
    marginBottom: 0,
    width: '50%',
  },
  gasPriceTable: {
    width: '100%',
    marginTop: 16,
  },
});

export default styles;
