/* eslint-disable max-len */
import {ExpoPushMessage} from "expo-server-sdk";

const formatAmount = (amount: number): string => amount < 0 ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`;

/**
 * Creates a new Trip Notification
 * @param {string} expoPushToken Expo push token
 * @param {string} firstName First name of the user
 * @param {string} lastName Last name of the user
 * @param {number} amountOwed Amount owed
 * @param {boolean} isDriver Whether the user is a driver
 * @param {string} uid UID of the transaction
 * @return {ExpoPushMessage} Expo Message object
 */
export function createTripNotification(expoPushToken: string, firstName: string, lastName: string, amountOwed: number, isDriver: boolean, uid: string): ExpoPushMessage {
  const formattedAmount = formatAmount(amountOwed);
  return ({
    to: expoPushToken,
    sound: "default",
    title: "New Trip",
    body: `${firstName} ${lastName} added a new trip! You ${isDriver ? "are owed" : "owe"} ${formattedAmount}.`,
    data: {
      transactionUID: uid,
    },
  });
}

/**
 * Creates a new Settle Up Notification
 * @param {string} expoPushToken Expo push token
 * @param {string} firstName First name of the user
 * @param {string} lastName Last name of the user
 * @param {number} amountOwed Amount owed
 * @param {string} uid UID of the transaction
 * @return {ExpoPushMessage} Expo Message object
 */
export function createSettleNotification(expoPushToken: string, firstName: string, lastName: string, amountOwed: number, uid: string): ExpoPushMessage {
  const formattedAmount = formatAmount(amountOwed);
  return ({
    to: expoPushToken,
    sound: "default",
    title: "Settled Up",
    body: `${firstName} ${lastName} has settled up with you! Your balance of ${formattedAmount} has been cleared.`,
    data: {
      transactionUID: uid,
    },
  });
}

/**
 * Creates a new Friend Request Notification
 * @param {string} expoPushToken Expo push token
 * @param {string} firstName First name of the user
 * @param {string} lastName Last name of the user
 * @param {string} uid UID of the user sending the request
 * @return {ExpoPushMessage} Expo Message object
 */
export function createFriendRequestNotification(expoPushToken: string, firstName: string, lastName: string, uid: string): ExpoPushMessage {
  return ({
    to: expoPushToken,
    sound: "default",
    title: "Friend Request",
    body: `${firstName} ${lastName} wants to be your friend! Come back to GasMeUp to start sharing trips with them!`,
    data: {
      friendUID: uid,
    },
  });
}
