import { StyleSheet } from 'react-native';

import { colors } from './styles';

// Styles
const styles = StyleSheet.create({
  main: {
    height: '100%',
    paddingTop: 32,
    paddingBottom: 64,
  },
  table: {
    flex: 1,
    paddingVertical: 48,
    maxHeight: '90%',
  },
  friendInfoTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  friendInfoSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  friendInfoButtonSection: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 'auto',
  },
  friendInfoButton: {
    backgroundColor: colors.action,
    padding: 10,
    borderRadius: 5,
  },
  deleteFriendButton: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    width: 52,
    alignItems: 'center',
  },
  friendRequestsSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  acceptFriendRequestButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  actionIcon: {
    width: 30,
    marginHorizontal: 10,
  },
  rightAction: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  splitwiseButton: {
    backgroundColor: colors.splitwiseGreen,
    width: '40%',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

export default styles;
