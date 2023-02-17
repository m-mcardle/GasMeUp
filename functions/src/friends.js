// This should trigger when a user creates a new friend with status:"outgoing"
/**
 * Handles someone sending a friend request
 * @param {Object} db - The Firestore database
 * @param {Object} change - The change object
 */
async function handleOutgoingFriendRequest(db, change) {
  console.log("Handling outgoing friend request");
  const beforeData = change.before.data();
  const afterData = change.after.data();

  const uid = change.after.id;

  // Get value of the newly added friend request
  const oldFriendsList = Object.keys(beforeData.friends)
      .filter((uid) => beforeData.friends[uid].status === "outgoing");
  const friendsList = Object.keys(afterData.friends)
      .filter((uid) => afterData.friends[uid].status === "outgoing");
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

    const friendsFriends = friendDoc.data().friends ?? {};

    // Update friend's friend request list
    transaction.update(friendRef, {
      friends: {
        ...friendsFriends,
        [uid]: {
          status: "incoming",
          accepted: false,
          balance: 0,
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
async function handleAcceptedFriendRequest(db, change) {
  console.log("Handling accepted friend request");
  // const documentRef = change.after.ref;
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

      // Only need to run if this friend doesn't have this user as a friend
      if (friendDoc.data().friends[uid]?.status === "accepted") {
        console.log(`Friend (${friendUID}) already has ${uid} as friend`);
        return;
      }

      const friendsFriendsList = friendDoc.data().friends;
      console.log("Friend's friends list:", friendsFriendsList);

      const newFriendsList = {
        ...friendsFriendsList,
        [uid]: {
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
async function handleRemovedFriend(db, change) {
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

      // Only need to run if this friend has this user as a friend
      if (friendDoc.data().friends[uid] === undefined ) {
        console.log(`Friend (${friendUID}) doesn't have ${uid} as friend`);
        return;
      }

      const friendsFriendsList = friendDoc.data().friends;
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

module.exports = {
  handleOutgoingFriendRequest,
  handleAcceptedFriendRequest,
  handleRemovedFriend,
};
