/* eslint-disable max-len */
import friends from "./src/friends";

import * as functions from "firebase-functions";
import {Expo, ExpoPushMessage} from "expo-server-sdk";

import * as admin from "firebase-admin";
import {DocumentSnapshot, QueryDocumentSnapshot} from "firebase-admin/firestore";

import jwt from "jsonwebtoken";
import fs from "fs";
import axios from "axios";
import qs from "qs";

import {Friend, User} from "./global";

admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

type Transaction = admin.firestore.Transaction;
type DocumentReference = admin.firestore.DocumentReference;

export const sendTransactionNotifications = functions.firestore
    .document("Transactions/{transactionUID}")
    .onCreate(async (snapshot) => {
      // Get value of the newly added transaction
      const newData = snapshot.data();
      const payeeUID = newData.payeeUID;
      const payerUIDs = newData.payers;
      const creatorUID = newData.creator;

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

        const expoPushToken = data.notificationToken;
        if (Expo.isExpoPushToken(expoPushToken)) {
          console.log("Sending notification to", expoPushToken, "for", uid);
          const isDriver = uid === payeeUID;
          const amountOwed = isDriver ? costPerRider * payerUIDs.length : costPerRider;
          messages.push({
            to: expoPushToken,
            sound: "default",
            title: "New Trip",
            body: `${creatorData.firstName} ${creatorData.lastName} added a new trip! You ${isDriver ? "are owed" : "owe"} $${amountOwed}.`,
            data: {
              transactionUID: snapshot.id,
            },
          });
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
      // Get a reference to the payee
      const payeeRef = db.collection("Users").doc(payeeUID);

      // Get a reference to the payer
      const payerRefs = payerUIDs.map((uid: string) => db.collection("Users").doc(uid));

      const newPayeeObjects: Record<string, Friend> = {};

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction: Transaction) => {
        const payeeDoc = await transaction.get(payeeRef);
        const payerDocs = await Promise.all(payerRefs.map(async (ref: DocumentReference) => transaction.get(ref)));

        const payeeData = payeeDoc.data() ?? {};
        const payersData = payerDocs.map((doc) => doc.data());

        // Compute new balances
        payersData.forEach((payerData, i) => {
          const oldPayeeObject = payeeData.friends[payerData.uid] ?? {};
          const oldPayeeBalance = oldPayeeObject.balance ?? 0;
          const newPayeeBalance = oldPayeeBalance + costPerRider;

          const oldPayerObject = payerData.friends[payeeDoc.id] ?? {};
          const oldPayerBalance = oldPayerObject.balance ?? 0;
          const newPayerBalance = oldPayerBalance - costPerRider;

          const payerTransactions = payerData.transactions;
          payerTransactions.push(snapshot.id);

          const oldPayerFriends = payerData.friends;

          // Update payee balances
          newPayeeObjects[payerData.uid] = {
            ...oldPayeeObject,
            balance: newPayeeBalance,
          };

          console.log(`Updating payer's (${payerUIDs[i]}) balance with: ${newPayerBalance}`);
          // Update payer info
          transaction.update(payerRefs[i], {
            transactions: [...payerTransactions],
            friends: {
              ...oldPayerFriends,
              [payeeDoc.id]: {
                ...oldPayerObject,
                balance: newPayerBalance,
              },
            },
          });
        });

        console.log("Updating payee's balances with: ", newPayeeObjects);
        const oldPayeeFriends = payeeData.friends;
        const payeeTransactions = payeeData.transactions;
        payeeTransactions.push(snapshot.id);
        // Update payee info
        transaction.update(payeeRef, {
          transactions: [...payeeTransactions],
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

      /*
      The logic for friend requests are as follows:
      1. Bill requests to be friends with Fred and a new friend with status="outgoing" is added to Bill (frontend)
      2. handleOutGoingFriendRequest is called and adds a new friend with status="incoming" to Fred (functions)
      3. Fred accepts Bill's friend request and Bill's uid is set to status="accepted" on Fred's friends list (frontend)
      4. handleAcceptedFriendRequest is called and Fred's uid is set to status="accepted" on Bill's friends list (functions)
      */

      // TODO - Do I need to care about the transactions being orphaned / lost when a friend is removed?
      if (
        beforeOutgoingFriends !== afterOutgoingFriends &&
        beforeOutgoingFriends?.length < afterOutgoingFriends?.length
      ) {
        await friends.handleOutgoingFriendRequest(db, documentUID, after as User, beforeFriends, afterFriends);
      } else if (beforeAcceptedFriends !== afterAcceptedFriends) {
        const newFriendsLength = afterAcceptedFriends.length;
        const oldFriendsLength = beforeAcceptedFriends.length;
        if (newFriendsLength > oldFriendsLength) {
          // Right now this will fire twice, once for when the user adds it from the front-end and once from when the function adds it to the friend
          await friends.handleAcceptedFriendRequest(db, documentUID, beforeFriends, afterFriends);
        } else if (newFriendsLength < oldFriendsLength) {
          // Right now this will fire twice, once for when the user removes it from the front-end and once from when the function removes it from the friend
          await friends.handleRemovedFriends(db, documentUID, beforeFriends, afterFriends);
        }
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
  // Path to download key file from developer.apple.com/account/resources/authkeys/list
  const privateKey = fs.readFileSync("B34ZDLHVDF.p8");

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

  console.log(token);
  return token;
}

// https://github.com/jooyoungho/apple-token-revoke-in-firebase
export const getRefreshToken = functions.https.onRequest(async (request, response) => {
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
        console.log(err);
      });
});


export const revokeToken = functions.https.onRequest(async (request, response) => {
  const refreshToken = request.query.refresh_token;
  const clientSecret = makeJWT();

  const data = {
    "token": refreshToken,
    "client_id": "com.Virintus.GasMeUp",
    "client_secret": clientSecret,
    "token_type_hint": "refresh_token",
  };

  console.log(qs.stringify(data));

  return axios.post("https://appleid.apple.com/auth/revoke", qs.stringify(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
      .then(async (res) => {
        console.log(res.data);
        response.send("Complete");
      })
      .catch((err) => {
        console.log(err);
      });
});

