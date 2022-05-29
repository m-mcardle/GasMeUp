import { StyleSheet } from 'react-native';

import {
  colors, boldFont, semiBoldFont, font,
} from './styles';

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: 60,
    fontFamily: boldFont,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  main: {
    flex: 2,
    paddingVertical: 40,
    backgroundColor: colors.primary,
  },
  costSection: {
    backgroundColor: colors.green,
    borderRadius: 5,
    marginVertical: 10,
    padding: 5,
    width: '100%',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  costText: {
    fontSize: 52,
    textAlign: 'center',
    fontFamily: boldFont,
    color: colors.primary,
  },
  subStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  statBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    width: '49%',
  },
  statBoxText: {
    color: colors.primary,
    fontFamily: semiBoldFont,
    fontSize: 12,
    padding: 5,
  },
  dataContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ridersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    color: colors.primary,
    padding: 5,
    marginBottom: 30,
  },
  statsSection: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '75%',
    justifyContent: 'space-between',
    color: colors.primary,
  },
  numericInput: {
    fontSize: 12,
    fontFamily: font,
  },
  ridersText: {
    color: colors.primary,
    fontFamily: semiBoldFont,
    fontSize: 12,
  },
  adjustButton: {
    marginHorizontal: 5,
    height: 16,
    width: 16,
  },
});

export default styles;
