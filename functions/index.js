/* eslint-disable max-len */
const friends = require("./src/friends");

const functions = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.aggregateBalances = functions.firestore
    .document("Transactions/{transcationUI}")
    .onWrite(async (change, context) => {
      const newData = change.after.data();
      // Get value of the newly added transaction
      const payeeUID = newData.payeeUID;
      const payerUID = newData.payerUID;
      const amount = newData.amount;

      // Get a reference to the payee
      const payeeRef = db.collection("Users").doc(payeeUID);

      // Get a reference to the payer
      const payerRef = db.collection("Users").doc(payerUID);

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction) => {
        const payeeDoc = await transaction.get(payeeRef);
        const payerDoc = await transaction.get(payerRef);

        const payeeData = payeeDoc.data();
        const payerData = payerDoc.data();

        // Compute new balances
        const newPayeeBalance = payeeData.friends[payerDoc.id] + amount;
        const newPayerBalance = payerData.friends[payeeDoc.id] - amount;

        const payeeTransactions = payeeData.transactions;
        const payerTransactions = payerData.transactions;

        payeeTransactions.push(change.after.id);
        payerTransactions.push(change.after.id);

        const oldPayeeFriends = payeeData.friends;
        const oldPayerFriends = payerData.friends;

        // Update payee info
        transaction.update(payeeRef, {
          transactions: [...payeeTransactions],
          friends: {
            ...oldPayeeFriends,
            [payerDoc.id]: newPayeeBalance,
          },
        });

        // Update payer info
        transaction.update(payerRef, {
          transactions: [...payerTransactions],
          friends: {
            ...oldPayerFriends,
            [payeeDoc.id]: newPayerBalance,
          },
        });
      });
    });

exports.updateFriendsList = functions.firestore
    .document("Users/{uid}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();
      console.log("updateFriendsList Triggered", before, after);

      /*
      The logic for friend requests are as follows:
      1. Bill requests to be friends with Fred and an outgoingFriendRequest is added to Bill (frontend)
      2. handleOutGoingFriendRequest is called and adds an incomingFriendRequest to Fred (functions)
      3. Fred accepts Bill's friend request and Bill is added as a friend to Fred (frontend)
      4. handleAcceptedFriendRequest is called and Bill is added as a friend to Fred, and both the incomingFriendRequest and outgoingFriendRequest are removed from Fred and Bill respectively (functions)
      */
      if (
        before.outgoingFriendRequests !== after.outgoingFriendRequests &&
        after.outgoingFriendRequests?.length > before.outgoingFriendRequests?.length
      ) {
        friends.handleOutgoingFriendRequest(db, change);
      } else if (
        before.friends !== after.friends &&
        Object.keys(after.friends ?? {}).length > Object.keys(before.friends ?? {}).length
      ) {
        friends.handleAcceptedFriendRequest(db, change);
      }
    });
