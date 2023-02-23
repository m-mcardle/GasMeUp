/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as admin from "firebase-admin";
import {FriendsField} from "../global";

// This should trigger when a user creates a new friend with status:"outgoing"
/**
 * Handles someone sending a friend request
 * @param {Firestore} db - The Firestore database
 * @param {String} uid - The UID of the changed document
 * @param {Object} document - The new document
 * @param {FriendsField} beforeFriends - The friends object before
 * @param {FriendsField} afterFriends - The friends object after
 */
async function handleOutgoingFriendRequest(
    db: admin.firestore.Firestore,
    uid: string,
    document: any,
    beforeFriends: FriendsField,
    afterFriends: FriendsField,
) {
  console.log("Handling outgoing friend request");
  console.log("UID: ", uid);

  const documentRef = db.collection("Users").doc(uid);


  // Get value of the newly added friend request
  const oldFriendsList = Object.keys(beforeFriends ?? {})
      .filter((uid) => beforeFriends[uid].status === "outgoing");
  const friendsList = Object.keys(afterFriends ?? {})
      .filter((uid) => afterFriends[uid].status === "outgoing");
  const friendTempUID = friendsList.find((friend) =>
    !oldFriendsList.includes(friend),
  ) ?? "Unknown";
  const friendEmail = afterFriends[friendTempUID]?.email ?? "";

  console.log("Old friends list:", oldFriendsList);
  console.log("New friends list:", friendsList);
  console.log("New friend (garbage) UID:", friendTempUID);
  console.log("New friend email:", friendEmail);

  const querySnapshot = await db.collection("Users")
      .where("email", "==", friendEmail).get();

  const friendDoc = querySnapshot.docs[0];
  if (!friendDoc || !friendDoc.exists) {
    console.log("Friend document not found - deleting friend request");
    // TODO: Perform logic here to send an email to the user instead of removing friend request
    const cleanedFriends = {...afterFriends};
    delete cleanedFriends[friendTempUID];
    await documentRef.update({
      friends: {
        ...cleanedFriends,
      },
    });
    return;
  }

  const friendData = friendDoc.data();
  const friendUID = friendDoc.id;
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
          email: document.email,
        },
      },
    });

    const outgoingFriendData = {...afterFriends[friendTempUID]};
    delete afterFriends[friendTempUID];

    // Replace the garbage UID with the real UID
    transaction.update(documentRef, {
      friends: {
        ...afterFriends,
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
 * @param {String} uid - The UID of the changed document
 * @param {FriendsField} beforeFriends - The friends object before
 * @param {FriendsField} afterFriends - The friends object after
 */
async function handleAcceptedFriendRequest(
    db: admin.firestore.Firestore,
    uid: string,
    beforeFriends: FriendsField,
    afterFriends: FriendsField,
) {
  console.log("Handling accepted friend request");
  // Get value of the newly accepted friend request
  const oldFriendsList = Object.keys(beforeFriends ?? {})
      .filter((uid) => beforeFriends[uid].status === "accepted");
  const friendsList = Object.keys(afterFriends ?? {})
      .filter((uid) => afterFriends[uid].status === "accepted");
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
 * @param {String} uid - The UID of the changed document
 * @param {FriendsField} beforeFriends - The friends object before
 * @param {FriendsField} afterFriends - The friends object after
 */
async function handleRemovedFriend(db: admin.firestore.Firestore, uid: string, beforeFriends: FriendsField, afterFriends: FriendsField) {
  console.log("Handling removed friend");

  // Get value of the newly added transaction
  const oldFriendsList = Object.keys(beforeFriends ?? {});
  const friendsList = Object.keys(afterFriends ?? {});
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
