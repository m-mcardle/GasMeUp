// Firestore security rules: every read/write the shipped app performs must be
// allowed, and every known attack must be denied.
import {afterAll, beforeAll, beforeEach, describe, expect, it} from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc,
  updateDoc, where,
} from "firebase/firestore";

import {
  A, B, C, D, E, G, EMULATOR_HOST, EMULATOR_PORT, PROJECT_ID,
  accepted, incoming, loadRules, outgoing, seedUsers, settlePayload,
  tripPayload, userDoc,
} from "./helpers.js";

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
      rules: loadRules(),
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, data] of Object.entries(seedUsers())) {
      await setDoc(doc(db, "Users", uid), data);
      await setDoc(doc(db, "SecureUsers", uid), {uid});
    }
    await setDoc(doc(db, "Transactions", "t-alice-bob"),
        tripPayload({creator: A, driver: A, friends: [B]}));
    await setDoc(doc(db, "Transactions", "t-bob-ghost"),
        {...tripPayload({creator: B, driver: B, friends: [G]})});
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// --- app helpers, copied from app/src/helpers/firestoreHelper.ts ---------
async function updateFriend(db, uid, friendUID, friend) {
  const userRef = doc(db, "Users", uid);
  const user = (await getDoc(userRef)).data();
  await updateDoc(userRef, {friends: {...user?.friends, [friendUID]: friend}});
}

async function removeFriend(db, uid, friendUID) {
  const userRef = doc(db, "Users", uid);
  const userFriends = (await getDoc(userRef)).data()?.friends;
  delete userFriends[friendUID];
  await updateDoc(userRef, {friends: {...userFriends}});
}

// FriendsScreen: every non-TEMP key in the user's friends map.
function friendsScreenQuery(db, friends) {
  const uids = Object.keys(friends).filter((u) => !u.includes("TEMP_"));
  return query(collection(db, "Users"), where("__name__", "in", uids));
}

// ===========================================================================
describe("legitimate app patterns (must be allowed)", () => {
  it("SignUpScreen: creates own Users + SecureUsers docs", async () => {
    const db = as("newbie");
    await assertSucceeds(setDoc(doc(db, "Users", "newbie"), {
      uid: "newbie", email: "newbie@example.com", firstName: "New",
      lastName: "User", transactions: [], friends: {}, notificationToken: "",
    }));
    await assertSucceeds(setDoc(doc(db, "SecureUsers", "newbie"),
        {uid: "newbie"}));
  });

  it("AppleLogin: getDoc of missing own doc then create with appleUser",
      async () => {
        const db = as("apple1");
        await assertSucceeds(getDoc(doc(db, "Users", "apple1")));
        await assertSucceeds(setDoc(doc(db, "Users", "apple1"), {
          uid: "apple1", email: "Unknown", firstName: "Unknown",
          lastName: "Unknown", transactions: [], friends: {},
          appleUser: true,
        }));
        await assertSucceeds(setDoc(doc(db, "SecureUsers", "apple1"),
            {uid: "apple1"}));
      });

  it("reads own Users and SecureUsers docs", async () => {
    await assertSucceeds(getDoc(doc(as(A), "Users", A)));
    await assertSucceeds(getDoc(doc(as(A), "SecureUsers", A)));
  });

  it("FriendsScreen: sets notificationToken", async () => {
    await assertSucceeds(updateDoc(doc(as(E), "Users", E),
        {notificationToken: "ExponentPushToken[new]"}));
  });

  it("Splitwise login/logout: splitwiseUID + SecureUsers token", async () => {
    const db = as(A);
    await assertSucceeds(updateDoc(doc(db, "SecureUsers", A),
        {splitwiseToken: "tok"}));
    await assertSucceeds(updateDoc(doc(db, "Users", A), {splitwiseUID: 1234}));
    await assertSucceeds(updateDoc(doc(db, "SecureUsers", A),
        {splitwiseToken: ""}));
    await assertSucceeds(updateDoc(doc(db, "SecureUsers", A),
        {splitwiseToken: null}));
    await assertSucceeds(updateDoc(doc(db, "Users", A), {splitwiseUID: ""}));
  });

  it("AddFriendsSection: adds a TEMP_ outgoing request (whole-map rewrite)",
      async () => {
        await assertSucceeds(updateFriend(as(A), A, "TEMP_1234",
            outgoing("someone@example.com")));
      });

  it("FriendRequestsSection: recipient reads the requester's doc",
      async () => {
        // carol -> alice is pending; alice lists carol's request.
        await assertSucceeds(getDoc(doc(as(A), "Users", C)));
      });

  it("FriendRequestsSection: accepts an incoming request", async () => {
    await assertSucceeds(updateFriend(as(A), A, C,
        accepted(`${C}@example.com`, 0)));
  });

  it("FriendRequestsSection: declines an incoming request", async () => {
    await assertSucceeds(removeFriend(as(A), A, C));
  });

  it("FriendRow: removes an accepted friend (with a balance)", async () => {
    await assertSucceeds(removeFriend(as(A), A, B));
  });

  it("FriendRow: cancels own outgoing request", async () => {
    await assertSucceeds(removeFriend(as(A), A, D));
  });

  it("FriendsScreen: __name__-in query over all friend keys incl. pending",
      async () => {
        const db = as(A);
        const me = (await getDoc(doc(db, "Users", A))).data();
        await assertSucceeds(getDocs(friendsScreenQuery(db, me.friends)));
        // dave's view includes his incoming request from alice
        const dDb = as(D);
        const dave = (await getDoc(doc(dDb, "Users", D))).data();
        await assertSucceeds(getDocs(friendsScreenQuery(dDb, dave.friends)));
        // carol's view includes her outgoing request to alice
        const cDb = as(C);
        const carol = (await getDoc(doc(cDb, "Users", C))).data();
        await assertSucceeds(getDocs(friendsScreenQuery(cDb, carol.friends)));
      });

  it("SaveTripScreen: __name__-in query over accepted friends", async () => {
    await assertSucceeds(getDocs(query(collection(as(B), "Users"),
        where("__name__", "in", [A]))));
  });

  it("SaveTripScreen: saves a trip as driver (split)", async () => {
    await assertSucceeds(addDoc(collection(as(A), "Transactions"),
        tripPayload({creator: A, driver: A, friends: [B]})));
  });

  it("SaveTripScreen: saves a trip as rider, friend drives (full)",
      async () => {
        await assertSucceeds(addDoc(collection(as(A), "Transactions"),
            tripPayload({creator: A, driver: B, friends: [B],
              splitType: "full"})));
      });

  it("SaveTripScreen: free trip (cost 0)", async () => {
    await assertSucceeds(addDoc(collection(as(A), "Transactions"),
        tripPayload({creator: A, driver: A, friends: [B], cost: 0})));
  });



  it("FriendInfoScreen: settle up when the friend owes me (negative cost)",
      async () => {
        await assertSucceeds(addDoc(collection(as(A), "Transactions"),
            settlePayload({creator: A, friend: B, amount: 12.5})));
      });

  it("FriendInfoScreen: settle up when I owe the friend (positive cost)",
      async () => {
        await assertSucceeds(addDoc(collection(as(B), "Transactions"),
            settlePayload({creator: B, friend: A, amount: -12.5})));
      });

  it("FriendInfoScreen: queries own transactions (array-contains)",
      async () => {
        await assertSucceeds(getDocs(query(collection(as(B), "Transactions"),
            where("users", "array-contains", B))));
      });

  it("SettingsScreen: deletes own Users and SecureUsers docs", async () => {
    await assertSucceeds(deleteDoc(doc(as(A), "Users", A)));
    await assertSucceeds(deleteDoc(doc(as(A), "SecureUsers", A)));
  });

  it("legacy ghost balance entry still readable (keeps friend query working)",
      async () => {
        await assertSucceeds(getDoc(doc(as(A), "Users", G)));
      });
});

// ===========================================================================
describe("finding 1: Transactions readable by any signed-in user", () => {
  it("non-party cannot get a transaction", async () => {
    await assertFails(getDoc(doc(as(E), "Transactions", "t-alice-bob")));
  });

  it("non-party cannot list all transactions", async () => {
    await assertFails(getDocs(collection(as(E), "Transactions")));
  });

  it("non-party cannot query someone else's transactions", async () => {
    await assertFails(getDocs(query(collection(as(E), "Transactions"),
        where("users", "array-contains", A))));
  });

  it("unauthenticated cannot read", async () => {
    await assertFails(getDoc(doc(anon(), "Transactions", "t-alice-bob")));
  });
});

// ===========================================================================
describe("finding 2: forged / malformed transactions", () => {
  const create = (uid, data) =>
    addDoc(collection(as(uid), "Transactions"), data);
  const base = () => tripPayload({creator: E, driver: E, friends: [A]});

  it("payer not listed in users", async () => {
    await assertFails(create(E, {...base(), users: [E]}));
  });

  it("creator is not a party to the money movement", async () => {
    // eve names bob as driver and alice as payer, listing herself in users
    await assertFails(create(E, {...tripPayload({creator: E, driver: B,
      friends: [B, A]}), payers: [A]}));
  });

  it("creator spoofed as someone else", async () => {
    await assertFails(create(E, tripPayload({creator: A, driver: A,
      friends: [B]})));
  });

  it("negative trip cost", async () => {
    await assertFails(create(E, {...base(), cost: -100, amount: -50}));
  });

  it("absurd trip cost", async () => {
    await assertFails(create(E, {...base(), cost: 1e12, amount: 5e11}));
  });

  it("wrong types (cost as string)", async () => {
    await assertFails(create(E, {...base(), cost: "30"}));
  });

  it("missing payers", async () => {
    const t = base();
    delete t.payers;
    await assertFails(create(E, t));
  });

  it("unknown extra fields", async () => {
    await assertFails(create(E, {...base(), isAdmin: true}));
  });

  it("duplicate payers (double charge)", async () => {
    await assertFails(create(E, {...base(), payers: [A, A],
      users: [E, A]}));
  });

  it("payee also listed as payer", async () => {
    await assertFails(create(E, {...base(), payers: [A, E]}));
  });

  it("unknown type", async () => {
    await assertFails(create(E, {...base(), type: "gift"}));
  });

  it("empty payers but another user named (fake solo trip)", async () => {
    await assertFails(create(E, {...base(), payers: [], users: [E, A]}));
  });

  it("empty payers paying someone else", async () => {
    await assertFails(create(E,
        {...base(), payers: [], users: [E], payeeUID: A}));
  });

  it("trip with no riders (trips are only saved to split costs)",
      async () => {
        await assertFails(create(E,
            tripPayload({creator: E, driver: E, friends: []})));
      });

  it("trip with no riders and a 'full' split (amount Infinity)",
      async () => {
        const trip = tripPayload({creator: E, driver: E, friends: [],
          splitType: "full"});
        expect(trip.amount).toBe(Infinity);
        await assertFails(create(E, trip));
      });

  it("settle-up with a non-friend", async () => {
    await assertFails(create(E,
        settlePayload({creator: E, friend: A, amount: -1000})));
  });

  it("settle-up naming someone else as payee", async () => {
    await assertFails(create(E, {...settlePayload({creator: E, friend: A,
      amount: -1000}), payeeUID: B, users: [B, A, E]}));
  });

  it("transactions cannot be updated or deleted", async () => {
    await assertFails(updateDoc(doc(as(A), "Transactions", "t-alice-bob"),
        {cost: 0}));
    await assertFails(deleteDoc(doc(as(A), "Transactions", "t-alice-bob")));
  });
  // NOTE: a well-formed trip naming a non-friend as payer passes the rules
  // (rules can't loop over payers); aggregateBalances skips it. See
  // functions.test.js.
});

// ===========================================================================
describe("finding 3: self-granted friend acceptance", () => {
  it("cannot add a victim directly as accepted", async () => {
    await assertFails(updateFriend(as(E), E, A,
        accepted(`${A}@example.com`, 0)));
  });

  it("cannot turn own outgoing request into accepted", async () => {
    await assertFails(updateFriend(as(A), A, D,
        accepted(`${D}@example.com`, 0)));
  });

  it("cannot forge an incoming request on own doc", async () => {
    await assertFails(updateFriend(as(E), E, A,
        incoming(`${A}@example.com`)));
  });

  it("cannot accept with a forged balance", async () => {
    await assertFails(updateFriend(as(A), A, C,
        accepted(`${C}@example.com`, 999)));
  });

  it("victim's doc stays unreadable to the attacker", async () => {
    await assertFails(getDoc(doc(as(E), "Users", A)));
  });
});

// ===========================================================================
describe("finding 4: pre-acceptance read of the target", () => {
  it("stranger cannot read a user", async () => {
    await assertFails(getDoc(doc(as(E), "Users", B)));
  });

  it("stranger cannot query users by email", async () => {
    await assertFails(getDocs(query(collection(as(E), "Users"),
        where("email", "==", `${A}@example.com`))));
  });

  // KNOWN GAP: alice -> dave is pending (dave has alice as 'incoming').
  // The shipped FriendsScreen query includes pending outgoing requests and
  // fails as a whole if any doc is denied, so this read must stay allowed
  // until the app filters that query to accepted friends.
  it("KNOWN GAP: requester can still read the pending target", async () => {
    await assertSucceeds(getDoc(doc(as(A), "Users", D)));
  });
});

// ===========================================================================
describe("finding 5: arbitrary writes to own Users doc", () => {
  it("cannot edit own balance with a friend", async () => {
    await assertFails(updateFriend(as(B), B, A,
        accepted(`${A}@example.com`, 1000)));
  });

  it("cannot edit balance while also adding a request", async () => {
    const db = as(B);
    const me = (await getDoc(doc(db, "Users", B))).data();
    await assertFails(updateDoc(doc(db, "Users", B), {friends: {
      ...me.friends,
      [A]: accepted(`${A}@example.com`, 1000),
      TEMP_x: outgoing("x@example.com"),
    }}));
  });

  it("cannot add an outgoing request with a balance", async () => {
    await assertFails(updateFriend(as(E), E, "TEMP_x",
        {...outgoing("x@example.com"), balance: -500}));
  });

  it("cannot write own transactions list", async () => {
    await assertFails(updateDoc(doc(as(A), "Users", A),
        {transactions: ["forged"]}));
  });

  it("cannot add arbitrary fields", async () => {
    await assertFails(updateDoc(doc(as(A), "Users", A), {isAdmin: true}));
  });

  it("cannot change email (friend lookup key) or uid", async () => {
    await assertFails(updateDoc(doc(as(E), "Users", E),
        {email: `${A}@example.com`}));
    await assertFails(updateDoc(doc(as(E), "Users", E), {uid: A}));
  });

  it("cannot create own doc pre-seeded with friends/transactions",
      async () => {
        await assertFails(setDoc(doc(as("mallory"), "Users", "mallory"), {
          ...userDoc("mallory", {[A]: accepted(`${A}@example.com`, 50)}),
        }));
        await assertFails(setDoc(doc(as("mallory"), "Users", "mallory"), {
          ...userDoc("mallory", {}, ["t-alice-bob"]),
        }));
      });

  it("cannot create or write another user's doc", async () => {
    await assertFails(setDoc(doc(as(E), "Users", "victim"),
        userDoc("victim")));
    await assertFails(updateDoc(doc(as(E), "Users", A),
        {notificationToken: "x"}));
    await assertFails(deleteDoc(doc(as(E), "Users", A)));
    await assertFails(getDoc(doc(as(E), "SecureUsers", A)));
  });

  it("forged-balance settle-up is impossible (balance edit denied)",
      async () => {
        // bob owes alice 12.50; he cannot flip it before settling.
        await assertFails(updateFriend(as(B), B, A,
            accepted(`${A}@example.com`, 500)));
      });
});
