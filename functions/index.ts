/* eslint-disable @stylistic/max-len */
import * as functions from "firebase-functions/v1";
import {Expo, ExpoPushMessage} from "expo-server-sdk";

import {initializeApp} from "firebase-admin/app";
import {getFirestore, DocumentReference, DocumentSnapshot, QueryDocumentSnapshot, Transaction} from "firebase-admin/firestore";

import jwt from "jsonwebtoken";
import fs from "node:fs";
import axios from "axios";
import qs from "qs";

import {Friend, User} from "./global";

import friends from "./src/friends";
import {createTripNotification, createSettleNotification} from "./src/notificationMessages";
import {areMutualFriends} from "./src/friendship";

initializeApp();

const db = getFirestore();
export const expo = new Expo();

export const sendTransactionNotifications = functions.firestore
    .document("Transactions/{transactionUID}")
    .onCreate(async (snapshot) => {
      // Get value of the newly added transaction
      const newData = snapshot.data();
      const payeeUID = newData.payeeUID;
      const payerUIDs = newData.payers;
      const creatorUID = newData.creator;

      const settledUp = newData.type === "settle";
      const cost = newData.cost;
      const splitType = newData.splitType;
      const onlyRidersPay = splitType === "full";
      const costPerRider = Number((onlyRidersPay ? cost / payerUIDs.length : cost / (payerUIDs.length + 1)).toFixed(2));

      const creatorDoc = await db.collection("Users").doc(creatorUID).get();
      const creatorData = await creatorDoc.data() ?? {};

      const messages: Array<ExpoPushMessage> = [];
      const usersToNotify = [...payerUIDs, payeeUID].filter((uid) => uid !== newData.creator);
      console.log("Users to notify:", usersToNotify);

      await Promise.all(usersToNotify.map(async (uid) => {
        const doc = await db.collection("Users").doc(uid).get();
        const data = await doc.data() ?? {};

        // Only notify people who are actually friends with the creator, so a
        // forged transaction can't be used to push-spam arbitrary users.
        if (!areMutualFriends(creatorUID, creatorData, uid, data)) {
          console.warn(`Not notifying ${uid}: not an accepted friend of creator ${creatorUID}`);
          return;
        }

        const expoPushToken = data.notificationToken;
        if (Expo.isExpoPushToken(expoPushToken)) {
          console.log("Sending notification to", expoPushToken, "for", uid);
          const isDriver = uid === payeeUID;
          const amountOwed = isDriver ? costPerRider * payerUIDs.length : costPerRider;

          if (settledUp) {
            messages.push(
                createSettleNotification(expoPushToken, creatorData.firstName, creatorData.lastName, amountOwed, snapshot.id)
            );
          } else {
            messages.push(
                createTripNotification(expoPushToken, creatorData.firstName, creatorData.lastName, amountOwed, isDriver, snapshot.id)
            );
          }
        } else {
          console.log("Not a valid token:", expoPushToken, "for", uid);
        }
      }));
      console.log(`Sending ${messages.length} notifications`);
      expo.sendPushNotificationsAsync(messages);
    });

export const aggregateBalances = functions.firestore
    .document("Transactions/{transactionUID}")
    .onCreate(async (snapshot) => {
      // Get value of the newly added transaction
      const newData = snapshot.data();
      const payeeUID = newData.payeeUID;
      const payerUIDs = newData.payers;
      const cost = newData.cost;
      const amount = newData.amount;
      const splitType = newData.splitType;
      const costPerRider = Number((splitType === "full" ? cost / payerUIDs.length : cost / (payerUIDs.length + 1)).toFixed(2));

      if (costPerRider !== amount) {
        console.warn(`costPerRider !== amount (${costPerRider} vs ${amount})`);
      }
      const creatorUID: string = newData.creator;

      // Get a reference to the payee
      const payeeRef = db.collection("Users").doc(payeeUID);

      // Get a reference to the payer
      const payerRefs = payerUIDs.map((uid: string) => db.collection("Users").doc(uid));

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction: Transaction) => {
        const payeeDoc = await transaction.get(payeeRef);
        const payerDocs = await Promise.all(payerRefs.map(async (ref: DocumentReference) => transaction.get(ref)));

        const payeeData = payeeDoc.data();
        const payersData = payerDocs.map((doc) => doc.data());

        if (!payeeData) {
          console.warn(`Payee (${payeeUID}) not found - skipping transaction ${snapshot.id}`);
          return;
        }

        // Idempotency: onCreate can be delivered more than once.
        if ((payeeData.transactions ?? []).includes(snapshot.id)) {
          console.log(`Transaction ${snapshot.id} already aggregated`);
          return;
        }

        // The creator must be a party to the transaction (the app always
        // creates trips/settle-ups it is part of).
        const partyData = (uid: string) => uid === payeeUID ? payeeData : payersData[payerUIDs.indexOf(uid)];
        if (creatorUID !== payeeUID && !payerUIDs.includes(creatorUID)) {
          console.warn(`Creator (${creatorUID}) is not a party to ${snapshot.id} - skipping`);
          return;
        }
        const creatorData = partyData(creatorUID);

        // Only people who are accepted friends of the creator can be pulled
        // into a transaction. The app only offers accepted friends.
        const trustedByCreator = (uid: string) => uid === creatorUID ||
          areMutualFriends(creatorUID, creatorData, uid, partyData(uid));

        if (!trustedByCreator(payeeUID)) {
          console.warn(`Payee (${payeeUID}) is not an accepted friend of creator (${creatorUID}) - skipping ${snapshot.id}`);
          return;
        }

        const newPayeeObjects: Record<string, Friend> = {};
        const seenPayers = new Set<string>();

        // Compute new balances
        payersData.forEach((payerData, i) => {
          const payerUID: string = payerUIDs[i];
          if (seenPayers.has(payerUID) || payerUID === payeeUID) {
            console.warn(`Skipping duplicate payer/payee (${payerUID}) in ${snapshot.id}`);
            return;
          }
          seenPayers.add(payerUID);

          if (!payerData) {
            console.warn(`Payer (${payerUID}) not found - skipping`);
            return;
          }
          if (!trustedByCreator(payerUID)) {
            console.warn(`Payer (${payerUID}) is not an accepted friend of creator (${creatorUID}) - skipping`);
            return;
          }

          const payerTransactions = [...(payerData.transactions ?? []), snapshot.id];

          // Balances only exist between accepted friends. A co-rider who
          // isn't friends with the driver still gets the trip in their
          // history, but no (invisible) balance entry is created.
          if (!areMutualFriends(payeeUID, payeeData, payerUID, payerData)) {
            console.warn(`Payer (${payerUID}) and payee (${payeeUID}) are not accepted friends - not updating balance`);
            transaction.update(payerRefs[i], {
              transactions: payerTransactions,
            });
            return;
          }

          const oldPayeeObject = payeeData.friends[payerUID];
          const oldPayeeBalance = oldPayeeObject.balance ?? 0;
          const newPayeeBalance = oldPayeeBalance + costPerRider;

          const oldPayerObject = payerData.friends[payeeUID];
          const oldPayerBalance = oldPayerObject.balance ?? 0;
          const newPayerBalance = oldPayerBalance - costPerRider;

          const oldPayerFriends = payerData.friends;

          // Update payee balances
          newPayeeObjects[payerUID] = {
            ...oldPayeeObject,
            balance: newPayeeBalance,
          };

          console.log(`Updating payer's (${payerUID}) balance with: ${newPayerBalance}`);
          // Update payer info
          transaction.update(payerRefs[i], {
            transactions: payerTransactions,
            friends: {
              ...oldPayerFriends,
              [payeeUID]: {
                ...oldPayerObject,
                balance: newPayerBalance,
              },
            },
          });
        });

        console.log("Updating payee's balances with: ", newPayeeObjects);
        const oldPayeeFriends = payeeData.friends ?? {};
        const payeeTransactions = [...(payeeData.transactions ?? []), snapshot.id];
        // Update payee info
        transaction.update(payeeRef, {
          transactions: payeeTransactions,
          friends: {
            ...oldPayeeFriends,
            ...newPayeeObjects,
          },
        });
      });
    });

export const updateFriendsList = functions.firestore
    .document("Users/{uid}")
    .onUpdate(async (change: functions.Change<QueryDocumentSnapshot>, context: functions.EventContext) => {
      console.log("updateFriendsList Triggered");
      const before = change.before.data();
      const after = change.after.data();
      const documentUID = context.params.uid;

      const beforeFriends = before.friends ?? {};
      const afterFriends = after.friends ?? {};

      const beforeFriendUIDs = Object.keys(beforeFriends ?? {});
      const afterFriendUIDs = Object.keys(afterFriends ?? {});

      const beforeAcceptedFriends = beforeFriendUIDs.filter((uid) => beforeFriends[uid].status === "accepted");
      const afterAcceptedFriends = afterFriendUIDs.filter((uid) => afterFriends[uid].status === "accepted");

      const beforeOutgoingFriends = beforeFriendUIDs.filter((uid) => beforeFriends[uid].status === "outgoing");
      const afterOutgoingFriends = afterFriendUIDs.filter((uid) => afterFriends[uid].status === "outgoing");

      const beforeIncomingFriends = beforeFriendUIDs.filter((uid) => beforeFriends[uid].status === "incoming");
      const afterIncomingFriends = afterFriendUIDs.filter((uid) => afterFriends[uid].status === "incoming");

      /*
      The logic for friend requests are as follows:
      1. Bill requests to be friends with Fred and a new friend with status="outgoing" is added to Bill (frontend)
      2. handleOutGoingFriendRequest is called and adds a new friend with status="incoming" to Fred (functions)
      3. Fred accepts Bill's friend request and Bill's uid is set to status="accepted" on Fred's friends list (frontend)
      4. handleAcceptedFriendRequest is called and Fred's uid is set to status="accepted" on Bill's friends list (functions)
      */

      // TODO - Do I need to care about the transactions being orphaned / lost when a friend is removed?
      if (
        beforeOutgoingFriends.length < afterOutgoingFriends.length
      ) {
        await friends.handleOutgoingFriendRequest(db, documentUID, after as User, beforeFriends, afterFriends);
      } else if (
        beforeAcceptedFriends.length < afterAcceptedFriends.length
      ) {
        // Right now this will fire twice, once for when the user adds it from the front-end and once from when the function adds it to the friend
        await friends.handleAcceptedFriendRequest(db, documentUID, beforeFriends, afterFriends);
      } else if (
        beforeAcceptedFriends.length > afterAcceptedFriends.length
      ) {
        // Right now this will fire twice, once for when the user removes it from the front-end and once from when the function removes it from the friend
        await friends.handleRemovedFriends(db, documentUID, beforeFriends, afterFriends);
      } else if (
        beforeIncomingFriends.length > afterIncomingFriends.length
      ) {
        // Order of operations is important here - must check for the accepted path before this one
        await friends.handleRemovedFriends(db, documentUID, beforeFriends, afterFriends);
      } else {
        console.log("No friends list changes detected");
      }
    });

export const updateFriendsListDeletion = functions.firestore
    .document("Users/{uid}")
    .onDelete(async (oldDocument: DocumentSnapshot) => {
      console.log("updateFriendsListDeletion Triggered");
      const before = oldDocument.data() ?? {};

      await friends.handleRemovedFriends(db, oldDocument.id, before.friends, {});
    });


/**
 * Creates a JWT
 * @return {string} JWT token
 */
function makeJWT() {
  // Sign in with Apple key (developer.apple.com/account/resources/authkeys/list), stored in
  // Secret Manager as APPLE_SIGN_IN_KEY. The local .p8 file is only a fallback for the emulator.
  const privateKey = process.env[APPLE_SIGN_IN_KEY] || fs.readFileSync("B34ZDLHVDF.p8");

  // Sign with your team ID and key ID information.
  const token = jwt.sign({
    iss: "2Q4CXG64VY",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
    aud: "https://appleid.apple.com",
    sub: "com.Virintus.GasMeUp",

  }, privateKey, {
    algorithm: "ES256",
    header: {
      alg: "ES256",
      kid: "B34ZDLHVDF",
    }});

  return token;
}

const APPLE_SIGN_IN_KEY = "APPLE_SIGN_IN_KEY";
const appleFunctions = functions.runWith({secrets: [APPLE_SIGN_IN_KEY]});

/**
 * Logs an Apple token endpoint failure without the request config, which holds the client secret.
 * @param {string} context Which endpoint failed
 * @param {unknown} err The error thrown by axios
 */
function logAppleError(context: string, err: unknown) {
  if (axios.isAxiosError(err)) {
    console.error(`${context} failed: ${err.response?.status ?? "no response"} ${JSON.stringify(err.response?.data ?? err.message)}`);
  } else {
    console.error(`${context} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// https://github.com/jooyoungho/apple-token-revoke-in-firebase
export const getRefreshToken = appleFunctions.https.onRequest(async (request, response) => {
  const code = request.query.code;
  const clientSecret = makeJWT();

  const data = {
    "code": code,
    "client_id": "com.Virintus.GasMeUp",
    "client_secret": clientSecret,
    "grant_type": "authorization_code",
  };

  return axios.post("https://appleid.apple.com/auth/token", qs.stringify(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
      .then(async (res) => {
        const refreshToken = res.data.refresh_token;
        response.send(refreshToken);
      })
      .catch((err) => {
        logAppleError("getRefreshToken", err);
        response.status(500).send("Failed to get refresh token");
      });
});


export const revokeToken = appleFunctions.https.onRequest(async (request, response) => {
  const refreshToken = request.query.refresh_token;
  const clientSecret = makeJWT();

  const data = {
    "token": refreshToken,
    "client_id": "com.Virintus.GasMeUp",
    "client_secret": clientSecret,
    "token_type_hint": "refresh_token",
  };

  return axios.post("https://appleid.apple.com/auth/revoke", qs.stringify(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
      .then(async () => {
        response.send("Complete");
      })
      .catch((err) => {
        logAppleError("revokeToken", err);
        response.status(500).send("Failed to revoke token");
      });
});

