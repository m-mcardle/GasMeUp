import {DocumentData} from "firebase-admin/firestore";

/**
 * Whether `userData` (a `Users` doc) lists `otherUID` as an accepted friend.
 * @param {DocumentData | undefined} userData - The user's document data
 * @param {string} otherUID - The other user's UID
 * @return {boolean} true if the friend entry has status "accepted"
 */
export function listsAsAcceptedFriend(
    userData: DocumentData | undefined,
    otherUID: string,
): boolean {
  return userData?.friends?.[otherUID]?.status === "accepted";
}

/**
 * Whether two users are mutually accepted friends. Each side's entry lives
 * in that user's own document, so neither user can forge the other's half.
 * @param {string} aUID - First user's UID
 * @param {DocumentData | undefined} aData - First user's document data
 * @param {string} bUID - Second user's UID
 * @param {DocumentData | undefined} bData - Second user's document data
 * @return {boolean} true if both list each other as accepted
 */
export function areMutualFriends(
    aUID: string,
    aData: DocumentData | undefined,
    bUID: string,
    bData: DocumentData | undefined,
): boolean {
  return listsAsAcceptedFriend(aData, bUID) &&
    listsAsAcceptedFriend(bData, aUID);
}
