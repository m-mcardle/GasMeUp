import * as admin from "firebase-admin";

// This should trigger when a user creates a new friend with status:"outgoing"
/**
 * Handles someone sending a friend request
 * @param {Firestore} db - The Firestore database
 * @param {Object} change - The change object
 */
async function handleOutgoingFriendRequest(
    db: admin.firestore.Firestore,
    change: any
) {
  console.log("Handling outgoing friend request");
  console.log("UID: ", change.after.id);
  const beforeData = change.before.data();
  const afterData = change.after.data();
  const uid = change.after.id;
  // const uid = "1hiiw6Hfw2URZQVu1H2pOLeOwOR2";
  const documentRef = change.after.ref;
  // const documentRef = db.collection("Users").doc(uid);


  // Get value of the newly added friend request
  const oldFriendsList = Object.keys(beforeData.friends)
      .filter((uid) => beforeData.friends[uid].status === "outgoing");
  const friendsList = Object.keys(afterData.friends)
      .filter((uid) => afterData.friends[uid].status === "outgoing");
  const friendTempUID = friendsList.find((friend) =>
    !oldFriendsList.includes(friend),
  ) ?? "Unknown";
  const friendEmail = afterData.friends[friendTempUID]?.email ?? "";

  console.log("Old friends list:", oldFriendsList);
  console.log("New friends list:", friendsList);
  console.log("New friend (garbage) UID:", friendTempUID);
  console.log("New friend email:", friendEmail);

  const querySnapshot = await db.collection("Users")
      .where("email", "==", friendEmail).get();

  const friendDoc = querySnapshot.docs[0];
  const friendData = friendDoc.data();
  if (!friendData.uid) {
    console.log("Friend document not found");
    return;
  }

  const friendUID = friendData.uid;
  console.log("New friend UID:", friendUID);

  // Update aggregations in a transaction
  await db.runTransaction(async (transaction) => {
    // Only need to run if this friend doesn't have this user as a friend
    if (friendData.friends[uid]) {
      console.log(`Friend (${friendUID}) already has ${uid} as friend`);
      return;
    }

    const friendsFriends = friendData.friends ?? {};

    // Update friend's friend request list
    transaction.update(friendDoc.ref, {
      friends: {
        ...friendsFriends,
        [uid]: {
          status: "incoming",
          accepted: false,
          balance: 0,
        },
      },
    });

    const outgoingFriendData = {...afterData.friends[friendTempUID]};
    delete afterData.friends[friendTempUID];

    // Replace the garbage UID with the real UID
    transaction.update(documentRef, {
      friends: {
        ...afterData.friends,
        [friendUID]: {
          ...outgoingFriendData,
        },
      },
    });
  });
}

// This should trigger when a user updates a friend with status:"accepted"
/**
 * Handles someone accepting a friend request
 * @param {Object} db - The Firestore database
 * @param {Object} change - The change object
 */
async function handleAcceptedFriendRequest(
    db: admin.firestore.Firestore,
    change: any
) {
  console.log("Handling accepted friend request");
  const beforeData = change.before.data();
  const afterData = change.after.data();

  const uid = change.after.id;

  // Get value of the newly accepted friend request
  const oldFriendsList = Object.keys(beforeData.friends)
      .filter((uid) => beforeData.friends[uid].status === "accepted");
  const friendsList = Object.keys(afterData.friends)
      .filter((uid) => afterData.friends[uid].status === "accepted");
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

  try {
    // Update aggregations in a transaction
    await db.runTransaction(async (transaction) => {
      const friendDoc = await transaction.get(friendRef);
      const friendData = friendDoc.data() ?? {};

      // Only need to run if this friend doesn't have this user as a friend
      if (friendData.friends[uid]?.status === "accepted") {
        console.log(`Friend (${friendUID}) already has ${uid} as friend`);
        return;
      }

      const friendsFriendsList = friendData.friends;
      console.log("Friend's friends list:", friendsFriendsList);

      const newFriendsList = {
        ...friendsFriendsList,
        [uid]: {
          ...friendsFriendsList[uid],
          status: "accepted",
          accepted: true,
          balance: 0,
        },
      };

      console.log("Friend's new friends list:", newFriendsList);

      // Update friend's friends list and remove outgoing friend request
      transaction.update(friendRef, {
        friends: {
          ...newFriendsList,
        },
      });
    });
  } catch (e) {
    console.error(e);
  }

  console.log("Done `handleAcceptedFriendRequest`");
}


/**
 * Handles someone removing a friend
 * @param {Object} db - The Firestore database
 * @param {Object} change - The change object
 */
async function handleRemovedFriend(db: admin.firestore.Firestore, change: any) {
  console.log("Handling removed friend");
  const beforeData = change.before.data();
  const afterData = change.after.data();

  const uid = change.after.id;

  // Get value of the newly added transaction
  const oldFriendsList = Object.keys(beforeData.friends);
  const friendsList = Object.keys(afterData.friends);
  const friendUID = oldFriendsList.find((friend) =>
    !friendsList.includes(friend),
  );

  console.log("Old friends list:", oldFriendsList);
  console.log("New friends list:", friendsList);
  console.log("Removed friend UID:", friendUID);

  if (!friendUID) {
    console.log("Friend document not found");
    return;
  }

  // Get a reference to the new friend
  const friendRef = db.collection("Users").doc(friendUID);

  try {
    // Update aggregations in a transaction
    await db.runTransaction(async (transaction) => {
      const friendDoc = await transaction.get(friendRef);
      const friendData = friendDoc.data() ?? {};

      // Only need to run if this friend has this user as a friend
      if (friendData.friends[uid] === undefined ) {
        console.log(`Friend (${friendUID}) doesn't have ${uid} as friend`);
        return;
      }

      const friendsFriendsList = friendData.friends;
      delete friendsFriendsList[uid];

      console.log("Friend's new friends list:", friendsFriendsList);

      // Update friend's friends list and remove outgoing friend request
      transaction.update(friendRef, {
        friends: {
          ...friendsFriendsList,
        },
      });
    });
  } catch (e) {
    console.error(e);
  }

  console.log("Done `handleRemovedFriend`");
}

export default {
  handleOutgoingFriendRequest,
  handleAcceptedFriendRequest,
  handleRemovedFriend,
};
