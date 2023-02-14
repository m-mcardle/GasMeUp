/* eslint-disable max-len */
const friends = require("./src/friends");

const functions = require("firebase-functions");
const {Expo} = require("expo-server-sdk");

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

exports.sendTransactionNotifications = functions.firestore
    .document("Transactions/{transactionUID}")
    .onCreate(async (snapshot, context) => {
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
      const creatorData = await creatorDoc.data();

      const messages = [];
      const usersToNotify = [...payerUIDs, payeeUID].filter((uid) => uid !== newData.creator);
      console.log("Users to notify:", usersToNotify);

      await Promise.all(usersToNotify.map(async (uid) => {
        const ref = db.collection("Users").doc(uid);
        const doc = await ref.get();
        const data = await doc.data();

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

exports.aggregateBalances = functions.firestore
    .document("Transactions/{transactionUID}")
    .onCreate(async (snapshot, context) => {
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
      const payerRefs = payerUIDs.map((uid) => db.collection("Users").doc(uid));

      const newPayeeBalances = {};

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction) => {
        const payeeDoc = await transaction.get(payeeRef);
        const payerDocs = await Promise.all(payerRefs.map(async (ref) => transaction.get(ref)));

        const payeeData = payeeDoc.data();
        const payersData = payerDocs.map((doc) => doc.data());

        // Compute new balances
        payersData.forEach((payerData, i) => {
          const oldPayeeBalance = payeeData.friends[payerData.uid] ?? 0;
          const newPayeeBalance = oldPayeeBalance + costPerRider;

          const oldPayerBalance = payerData.friends[payeeDoc.id] ?? 0;
          const newPayerBalance = oldPayerBalance - costPerRider;

          const payerTransactions = payerData.transactions;
          payerTransactions.push(snapshot.id);

          const oldPayerFriends = payerData.friends;

          // Update payee balances
          newPayeeBalances[payerData.uid] = newPayeeBalance;

          // Update payer info
          transaction.update(payerRefs[i], {
            transactions: [...payerTransactions],
            friends: {
              ...oldPayerFriends,
              [payeeDoc.id]: newPayerBalance,
            },
          });
        });

        const oldPayeeFriends = payeeData.friends;
        const payeeTransactions = payeeData.transactions;
        payeeTransactions.push(snapshot.id);
        // Update payee info
        transaction.update(payeeRef, {
          transactions: [...payeeTransactions],
          friends: {
            ...oldPayeeFriends,
            ...newPayeeBalances,
          },
        });
      });
    });

exports.updateFriendsList = functions.firestore
    .document("Users/{uid}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();
      console.log("updateFriendsList Triggered");

      /*
      The logic for friend requests are as follows:
      1. Bill requests to be friends with Fred and an outgoingFriendRequest is added to Bill (frontend)
      2. handleOutGoingFriendRequest is called and adds an incomingFriendRequest to Fred (functions)
      3. Fred accepts Bill's friend request and Bill is added as a friend to Fred (frontend)
      4. handleAcceptedFriendRequest is called and Bill is added as a friend to Fred, and both the incomingFriendRequest and outgoingFriendRequest are removed from Fred and Bill respectively (functions)
      */

      // TODO - Do I need to care about the transactions being orphaned / lost when a friend is removed?
      if (
        before.outgoingFriendRequests !== after.outgoingFriendRequests &&
        after.outgoingFriendRequests?.length > before.outgoingFriendRequests?.length
      ) {
        friends.handleOutgoingFriendRequest(db, change);
      } else if (before.friends !== after.friends) {
        const newFriendsLength = Object.keys(after.friends ?? {}).length;
        const oldFriendsLength = Object.keys(before.friends ?? {}).length;
        if (newFriendsLength > oldFriendsLength) {
          // Right now this will fire twice, once for when the user adds it from the front-end and once from when the function adds it to the friend
          friends.handleAcceptedFriendRequest(db, change);
        } else if (newFriendsLength < oldFriendsLength) {
          // Right now this will fire twice, once for when the user removes it from the front-end and once from when the function removes it from the friend
          friends.handleRemovedFriend(db, change);
        }
      }
    });
