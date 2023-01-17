import { StyleSheet } from 'react-native';

import {
  colors, boldFont, semiBoldFont, font,
} from './styles';

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    paddingVertical: 20,
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
    shadowColor: colors.secondary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
    marginBottom: 15,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  buttonSection: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'center',
  },
  calculateButton: {
    width: '45%',
    paddingHorizontal: 50,
  },
  saveTripHeaderContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
});

export default styles;
