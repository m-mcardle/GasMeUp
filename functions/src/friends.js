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
    console.log("Friend document not found");
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
      console.log(`Friend (${friendUID}) already has ${uid} as friend`);
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
      if (friendDoc.data().friends[uid]) {
        console.log(`Friend (${friendUID}) already has ${uid} as friend`);
        return;
      }

      const friendsFriendsList = friendDoc.data().friends;

      console.log("Friend's friends list:", friendsFriendsList);

      const newOutgoingFriendRequests = friendDoc.data().outgoingFriendRequests
          .filter((friend) => friend !== uid);

      console.log(
          "Friend's new outgoing friend requests:",
          newOutgoingFriendRequests,
      );


      const newIncomingFriendRequests = afterData.incomingFriendRequests
          .filter((friend) => friend !== friendUID);

      console.log("New incoming friend requests:", newIncomingFriendRequests);

      // Update friend's friends list and remove outgoing friend request
      transaction.update(friendRef, {
        friends: {
          ...friendsFriendsList,
          [uid]: 0,
        },
        outgoingFriendRequests: [
          ...newOutgoingFriendRequests,
        ],
      });

      // Update user's incoming friend requests
      transaction.update(documentRef, {
        incomingFriendRequests: [
          ...newIncomingFriendRequests,
        ],
      });
    });
  } catch (e) {
    console.error(e);
  }

  console.log("Done `handleAcceptedFriendRequest`");
}

module.exports = {
  handleOutgoingFriendRequest,
  handleAcceptedFriendRequest,
};
