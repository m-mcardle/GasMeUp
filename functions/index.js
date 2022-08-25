const functions = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.aggregateBalances = functions.firestore
    .document("Transactions/{transcationUI}")
    .onWrite(async (change, context) => {
      // Get value of the newly added transaction
      const payeeUID = change.after.data().payeeUID;
      const payerUID = change.after.data().payerUID;
      const amount = change.after.data().amount;

      // Get a reference to the payee
      const payeeRef = db.collection("Users").doc(payeeUID);

      // Get a reference to the payer
      const payerRef = db.collection("Users").doc(payerUID);

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction) => {
        const payeeDoc = await transaction.get(payeeRef);
        const payerDoc = await transaction.get(payerRef);

        // Compute new balances
        const newPayeeBalance = payeeDoc.data().friends[payerDoc.id] + amount;
        const newPayerBalance = payerDoc.data().friends[payeeDoc.id] - amount;

        const payeeTransactions = payeeDoc.data().transactions;
        const payerTransactions = payerDoc.data().transactions;

        payeeTransactions.push(change.after.id);
        payerTransactions.push(change.after.id);

        const oldPayeeFriends = payeeDoc.data().friends;
        const oldPayerFriends = payerDoc.data().friends;

        // Update payee info
        transaction.update(payeeRef, {
          transactions: [...payerTransactions],
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
      // Only needs to run when a friends list changes
      if (change.before.data().friends === change.after.data().friends) {
        return;
      }
      const uid = change.after.id;

      // Get value of the newly added transaction
      const oldFriendsList = Object.keys(change.before.data().friends);
      const friendsList = Object.keys(change.after.data().friends);
      const friendUID = friendsList.find((friend) =>
        !oldFriendsList.includes(friend),
      );

      console.log("Old friends list:", oldFriendsList);
      console.log("New friends list:", friendsList);
      console.log("New friend UID:", friendUID);

      if (!friendUID) {
        console.log("Friend document not found");
        return;
      }

      // Get a reference to the new friend
      const friendRef = db.collection("Users").doc(friendUID);

      // Update aggregations in a transaction
      await db.runTransaction(async (transaction) => {
        const friendDoc = await transaction.get(friendRef);

        // Only need to run if this friend doesn't have this user as a friend
        if (friendDoc.data().friends[uid]) {
          console.log(`Friend (${friendUID}) already has ${uid} as friend`);
          return;
        }

        const friendsFriendsList = friendDoc.data().friends;

        console.log(`Updating ${friendUID} to have list:
          ${{...friendsFriendsList, [uid]: 0}}
        `);
        // Update friend's friends list
        transaction.update(friendRef, {
          friends: {
            ...friendsFriendsList,
            [uid]: 0,
          },
        });
      });
    });
