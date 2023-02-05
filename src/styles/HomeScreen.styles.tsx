import { StyleSheet } from 'react-native';

import {
  colors, boldFont, semiBoldFont,
} from './styles';

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: 50,
    fontFamily: boldFont,
  },
  heading: {
    fontSize: 18,
    fontFamily: boldFont,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costSection: {
    backgroundColor: colors.green,
    borderRadius: 5,
    marginBottom: 10,
    marginTop: 150,
    padding: 5,
    width: '100%',
    minHeight: 75,
    justifyContent: 'center',
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
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    width: '49%',
    minHeight: 25,
  },
  statBoxText: {
    color: colors.secondary,
    fontFamily: semiBoldFont,
    fontSize: 12,
    padding: 5,
  },
  dataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ridersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    justifyContent: 'space-between',
    backgroundColor: colors.tertiary,
    color: colors.secondary,
    padding: 5,
    marginBottom: 15,
  },
  statsSection: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '75%',
    justifyContent: 'space-between',
    color: colors.secondary,
  },
  ridersText: {
    color: colors.secondary,
    fontFamily: semiBoldFont,
    fontSize: 12,
  },
  adjustButton: {
    marginHorizontal: 5,
    height: 16,
    width: 16,
  },
  checkBoxSection: {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingTop: 48,
    alignItems: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.tertiary,
    borderRadius: 20,
    paddingTop: 32,
    paddingBottom: 4,
    marginVertical: '75%',
    width: '60%',
    alignSelf: 'center',
    borderWidth: 2,
  },
  modalCheckBox: {
    width: 12,
    height: 12,
    margin: 2,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '25%',
    backgroundColor: colors.secondaryAction,
  },
  buttonSection: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'center',
  },
  calculateButton: {
    width: '60%',
    paddingHorizontal: 50,
  },
  saveTripLocationHeaderContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  saveTripHeaderContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  addToFriendButton: {
    paddingHorizontal: 20,
  },
  saveTripButtonSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  secondaryButtonText: {
    color: colors.secondary,
    marginHorizontal: 2,
    fontSize: 8,
  },
  mapContainer: {
    marginTop: 'auto',
    marginBottom: 0,
    height: '80%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default styles;
