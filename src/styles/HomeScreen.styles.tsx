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
    borderRadius: 5,
    marginBottom: 10,
    marginTop: 30,
    padding: 5,
    width: '100%',
    minHeight: 100,
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
    fontSize: 64,
    textAlign: 'center',
    fontFamily: boldFont,
    color: colors.primary,
  },
  subStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
    width: '50%',
    minHeight: 50,
  },
  statBoxText: {
    alignItems: 'center',
    color: colors.gray,
    fontFamily: semiBoldFont,
    fontSize: 14,
    padding: 5,
    textAlign: 'center',
    width: '80%',
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
  checkBoxSection: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: colors.softBlack,
    borderRadius: 20,
    paddingTop: 32,
    paddingBottom: 4,
    marginVertical: '75%',
    width: '60%',
    alignSelf: 'center',
    borderWidth: 2,
  },
  modalCheckBox: {
    width: 24,
    height: 24,
    margin: 2,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '30%',
    backgroundColor: colors.secondaryAction,
  },
  buttonSection: {
    flexDirection: 'row',
    width: '70%',
    justifyContent: 'center',
  },
  calculateButton: {
    width: '50%',
    paddingHorizontal: 20,
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
    marginBottom: 0,
  },
  secondaryButtonText: {
    color: colors.secondary,
    marginHorizontal: 2,
  },
  statText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    width: '100%',
    justifyContent: 'center',
  },
  skeleton: {
    minHeight: 12,
    backgroundColor: colors.gray,
    width: '90%',
    borderRadius: 12,
  },
  mapView: {
    height: '30%',
    width: '70%',
    borderWidth: 1,
    borderColor: 'white',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
});

export default styles;
