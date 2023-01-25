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
  const oldFriendsList = beforeData.outgoingFriendRequests ?? [];
  const friendsList = afterData.outgoingFriendRequests ?? [];
  const friendUID = friendsList.find((friend) =>
    !oldFriendsList.includes(friend),
  );

  console.log("Old friends list:", oldFriendsList);
  console.log("New friends list:", friendsList);
  console.log("New friend UID:", friendUID);

  if (!friendUID) {
    console.warn("Friend document not found");
    return;
  }

  // Get a reference to the new friend
  const friendRef = db.collection("Users").doc(friendUID);

  // Update aggregations in a transaction
  await db.runTransaction(async (transaction) => {
    const friendDoc = await transaction.get(friendRef);

    // Only need to run if this friend doesn't have this user as a friend
    if (
      friendDoc.data().friends[uid] ||
      friendDoc.data().incomingFriendRequests?.includes(uid)
    ) {
      console.warn(`Friend (${friendUID}) already has ${uid} as friend`);
      return;
    }

    const friendsFriendRequests = friendDoc.data().incomingFriendRequests ?? [];

    // Update friend's friend request list
    transaction.update(friendRef, {
      incomingFriendRequests: [
        ...friendsFriendRequests,
        uid,
      ],
    });
  });
}

/**
 * Handles someone sending a friend request
 * @param {Object} db - The Firestore database
 * @param {Object} change - The change object
 */
async function handleAcceptedFriendRequest(db, change) {
  console.log("Handling accepted friend request");
  const documentRef = change.after.ref;
  const beforeData = change.before.data();
  const afterData = change.after.data();

  const uid = change.after.id;

  // Get value of the newly added transaction
  const oldFriendsList = Object.keys(beforeData.friends);
  const friendsList = Object.keys(afterData.friends);
  const friendUID = friendsList.find((friend) =>
    !oldFriendsList.includes(friend),
  );

  console.log("Old friends list:", oldFriendsList);
  console.log("New friends list:", friendsList);
  console.log("New friend UID:", friendUID);

  if (!friendUID) {
    console.warm("Friend document not found");
    return;
  }

  // Get a reference to the new friend
  const friendRef = db.collection("Users").doc(friendUID);

  // Update aggregations in a transaction
  await db.runTransaction(async (transaction) => {
    const friendDoc = await transaction.get(friendRef);

    // Only need to run if this friend doesn't have this user as a friend
    if (friendDoc.data().friends[uid]) {
      console.warn(`Friend (${friendUID}) already has ${uid} as friend`);
      return;
    }

    const friendsFriendsList = friendDoc.data().friends;

    // Update friend's friends list and remove outgoing friend request
    transaction.update(friendRef, {
      friends: {
        ...friendsFriendsList,
        [uid]: 0,
      },
      outgoingFriendRequests: [
        friendDoc.data().outgoingFriendRequests.filter(
            (friend) => friend !== uid,
        ),
      ],
    });
  });

  // Remove friend request from user
  await documentRef.update({
    incomingFriendRequests: [
      afterData.incomingFriendRequests.filter(
          (friend) => friend !== friendUID,
      ),
    ],
  });
}

module.exports = {
  handleOutgoingFriendRequest,
  handleAcceptedFriendRequest,
};
