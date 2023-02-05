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
  },
  friendInfoTitle: {
    fontSize: 24,
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
  headerSection: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    flexDirection: 'row',
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
});

export default styles;
