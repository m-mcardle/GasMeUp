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
