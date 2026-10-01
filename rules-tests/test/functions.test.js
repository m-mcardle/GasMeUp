// Firestore-triggered Cloud Functions, run in-process against the Firestore
// emulator. Writes that the app would make are applied with the Admin SDK
// (the rules are covered by rules.test.js); a small "trigger pump" then
// replays updateFriendsList / updateFriendsListDeletion for every Users doc
// that changed, until nothing changes, mimicking the deployed trigger chain.
//
// FUNCTIONS_LIB can point at another build (e.g. the pre-hardening lib) to
// see which attacks it lets through.
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {isDeepStrictEqual} from "node:util";
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi}
  from "vitest";

import {
  A, B, C, D, E, G, EMULATOR_HOST, EMULATOR_PORT, PROJECT_ID, TOKEN,
  accepted, outgoing, seedUsers, settlePayload, tripPayload,
} from "./helpers.js";

process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG = JSON.stringify({projectId: PROJECT_ID});

const here = path.dirname(fileURLToPath(import.meta.url));
const libDir = process.env.FUNCTIONS_LIB ?
  path.resolve(process.env.FUNCTIONS_LIB) :
  path.resolve(here, "../../functions/lib");
const require = createRequire(path.join(libDir, "index.js"));
const fns = require(path.join(libDir, "index.js"));
const {getFirestore} = require("firebase-admin/firestore");

const db = getFirestore();
let pushSpy;

async function clearFirestore() {
  const url = `http://${EMULATOR_HOST}:${EMULATOR_PORT}/emulator/v1/` +
    `projects/${PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(url, {method: "DELETE"});
  if (!res.ok) throw new Error(`clear failed: ${res.status}`);
}

async function snapshotUsers() {
  const snap = await db.collection("Users").get();
  return new Map(snap.docs.map((d) => [d.id, d]));
}

/** Replay Users triggers until the database is quiescent. */
async function pump(before) {
  for (let round = 0; round < 10; round++) {
    const after = await snapshotUsers();
    const work = [];
    for (const [id, b] of before) {
      const a = after.get(id);
      if (!a) {
        work.push(() => fns.updateFriendsListDeletion.run(b,
            {params: {uid: id}}));
      } else if (!isDeepStrictEqual(b.data(), a.data())) {
        work.push(() => fns.updateFriendsList.run({before: b, after: a},
            {params: {uid: id}}));
      }
    }
    if (!work.length) return;
    for (const w of work) await w();
    before = after;
  }
  throw new Error("trigger pump did not settle");
}

/** Apply a client write to Users/{uid} and run the resulting triggers. */
async function clientUpdateUser(uid, mutate) {
  const before = await snapshotUsers();
  const ref = db.doc(`Users/${uid}`);
  const data = (await ref.get()).data();
  await ref.set(mutate(structuredClone(data)));
  await pump(before);
}

async function clientDeleteUser(uid) {
  const before = await snapshotUsers();
  await db.doc(`Users/${uid}`).delete();
  await pump(before);
}

/** Create a Transaction and run its onCreate triggers (+ the cascade). */
async function clientCreateTransaction(data, {runAggregateTwice} = {}) {
  const ref = await db.collection("Transactions").add(data);
  const snap = await ref.get();
  const before = await snapshotUsers();
  const ctx = {params: {transactionUID: ref.id}};
  await fns.sendTransactionNotifications.run(snap, ctx);
  await fns.aggregateBalances.run(snap, ctx);
  if (runAggregateTwice) await fns.aggregateBalances.run(snap, ctx);
  await pump(before);
  return ref.id;
}

const user = async (uid) => (await db.doc(`Users/${uid}`).get()).data();
const sentMessages = () => pushSpy.mock.calls.flatMap(([msgs]) => msgs);

beforeAll(() => {
  // Silence trigger logging.
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

beforeEach(async () => {
  await clearFirestore();
  pushSpy = vi.spyOn(fns.expo, "sendPushNotificationsAsync")
      .mockResolvedValue([]);
  const batch = db.batch();
  for (const [uid, data] of Object.entries(seedUsers())) {
    batch.set(db.doc(`Users/${uid}`), data);
  }
  await batch.commit();
});

afterEach(() => {
  pushSpy.mockRestore();
});

// ===========================================================================
describe("legitimate flows", () => {
  it("friend request: outgoing TEMP_ entry is resolved and mirrored",
      async () => {
        await clientUpdateUser(A, (d) => {
          d.friends.TEMP_abc = outgoing(`${E}@example.com`);
          return d;
        });
        const alice = await user(A);
        const eve = await user(E);
        expect(alice.friends.TEMP_abc).toBeUndefined();
        expect(alice.friends[E]).toEqual(outgoing(`${E}@example.com`));
        expect(eve.friends[A]).toEqual({status: "incoming", accepted: false,
          balance: 0, email: `${A}@example.com`});
        expect(sentMessages()).toEqual([{
          to: TOKEN(E),
          sound: "default",
          title: "Friend Request",
          body: "Alice Test wants to be your friend! Come back to GasMeUp " +
            "to start sharing trips with them!",
          data: {friendUID: A},
        }]);
      });

  it("friend request to an unknown email is removed", async () => {
    await clientUpdateUser(A, (d) => {
      d.friends.TEMP_x = outgoing("nobody@example.com");
      return d;
    });
    expect((await user(A)).friends.TEMP_x).toBeUndefined();
  });

  it("accepting an incoming request mirrors acceptance to the requester",
      async () => {
        await clientUpdateUser(A, (d) => {
          d.friends[C] = accepted(`${C}@example.com`, 0);
          return d;
        });
        expect((await user(A)).friends[C]).toEqual(
            accepted(`${C}@example.com`, 0));
        expect((await user(C)).friends[A]).toEqual(
            accepted(`${A}@example.com`, 0));
      });

  it("end-to-end: request then accept", async () => {
    await clientUpdateUser(E, (d) => {
      d.friends.TEMP_1 = outgoing(`${B}@example.com`);
      return d;
    });
    await clientUpdateUser(B, (d) => {
      d.friends[E] = accepted(`${E}@example.com`, 0);
      return d;
    });
    expect((await user(E)).friends[B]).toEqual(
        accepted(`${B}@example.com`, 0));
    expect((await user(B)).friends[E]).toEqual(
        accepted(`${E}@example.com`, 0));
  });

  it("declining an incoming request removes it from the requester",
      async () => {
        await clientUpdateUser(A, (d) => {
          delete d.friends[C];
          return d;
        });
        expect((await user(C)).friends[A]).toBeUndefined();
      });

  it("removing an accepted friend removes the mirror entry", async () => {
    await clientUpdateUser(A, (d) => {
      delete d.friends[B];
      return d;
    });
    expect((await user(B)).friends[A]).toBeUndefined();
  });

  it("trip as driver (split) updates both balances + notifies", async () => {
    const id = await clientCreateTransaction(
        tripPayload({creator: A, driver: A, friends: [B], cost: 30}));
    const alice = await user(A);
    const bob = await user(B);
    expect(alice.friends[B].balance).toBeCloseTo(27.5);
    expect(bob.friends[A].balance).toBeCloseTo(-27.5);
    expect(alice.friends[B].status).toBe("accepted");
    expect(alice.transactions).toEqual([id]);
    expect(bob.transactions).toEqual([id]);
    expect(sentMessages()).toEqual([{
      to: TOKEN(B),
      sound: "default",
      title: "New Trip",
      body: "Alice Test added a new trip! You owe $15.00.",
      data: {transactionUID: id},
    }]);
  });

  it("trip as rider, friend drives (full)", async () => {
    const id = await clientCreateTransaction(tripPayload({creator: A,
      driver: B, friends: [B], cost: 30, splitType: "full"}));
    expect((await user(B)).friends[A].balance).toBeCloseTo(17.5);
    expect((await user(A)).friends[B].balance).toBeCloseTo(-17.5);
    expect(sentMessages()).toEqual([{
      to: TOKEN(B),
      sound: "default",
      title: "New Trip",
      body: "Alice Test added a new trip! You are owed $30.00.",
      data: {transactionUID: id},
    }]);
  });

  it("settle-up clears the balance on both sides", async () => {
    const id = await clientCreateTransaction(
        settlePayload({creator: A, friend: B, amount: 12.5}));
    expect((await user(A)).friends[B].balance).toBeCloseTo(0);
    expect((await user(B)).friends[A].balance).toBeCloseTo(0);
    expect(sentMessages()).toEqual([{
      to: TOKEN(B),
      sound: "default",
      title: "Settled Up",
      body: "Alice Test has settled up with you! Your balance of -$12.50 " +
        "has been cleared.",
      data: {transactionUID: id},
    }]);
  });

  it("account deletion removes the user from every friend", async () => {
    await clientDeleteUser(A);
    for (const uid of [B, C, D, G]) {
      expect((await user(uid)).friends[A]).toBeUndefined();
    }
  });

  it("account deletion continues past a friend whose doc is missing",
      async () => {
        // Regression for the early `return` / always-false check in
        // handleRemovedFriends: a missing friend doc aborted the loop.
        // Put the dangling entry first so it is processed first.
        const {friends} = await user(A);
        await db.doc(`Users/${A}`).update({friends: {
          "aaa-deleted": accepted("gone@example.com", 0), ...friends}});
        expect(Object.keys((await user(A)).friends)[0]).toBe("aaa-deleted");
        await clientDeleteUser(A);
        for (const uid of [B, C, D, G]) {
          expect((await user(uid)).friends[A]).toBeUndefined();
        }
      });
});

// ===========================================================================
describe("finding 2: forged transactions are neutralized", () => {
  it("trip charging a non-friend does not touch the victim", async () => {
    const victimBefore = await user(A);
    await clientCreateTransaction(
        tripPayload({creator: E, driver: E, friends: [A], cost: 1000}));
    expect(await user(A)).toEqual(victimBefore);
    expect((await user(E)).friends[A]).toBeUndefined();
    expect(sentMessages()).toEqual([]);
  });

  it("settle-up with a non-friend does not touch the victim", async () => {
    const victimBefore = await user(A);
    await clientCreateTransaction(
        settlePayload({creator: E, friend: A, amount: -1000}));
    expect(await user(A)).toEqual(victimBefore);
    expect(sentMessages()).toEqual([]);
  });

  it("creator cannot charge a friend-of-a-friend", async () => {
    // eve <-> bob are friends; bob <-> alice are friends; eve and alice are
    // not. eve rides with "driver" bob and lists alice as a co-rider.
    await db.doc(`Users/${E}`).update({
      [`friends.${B}`]: accepted(`${B}@example.com`, 0)});
    await db.doc(`Users/${B}`).update({
      [`friends.${E}`]: accepted(`${E}@example.com`, 0)});
    const aliceBefore = await user(A);
    await clientCreateTransaction(tripPayload({creator: E, driver: B,
      friends: [B, A], cost: 300}));
    expect(await user(A)).toEqual(aliceBefore);
    expect((await user(B)).friends[A].balance).toBe(-12.5);
    // eve's own share with bob is still applied
    expect((await user(B)).friends[E].balance).toBeCloseTo(100);
    expect(sentMessages().map((m) => m.to)).toEqual([TOKEN(B)]);
  });

  it("a re-delivered onCreate event is applied once", async () => {
    await clientCreateTransaction(
        tripPayload({creator: A, driver: A, friends: [B], cost: 30}),
        {runAggregateTwice: true});
    expect((await user(A)).friends[B].balance).toBeCloseTo(27.5);
    expect((await user(B)).friends[A].balance).toBeCloseTo(-27.5);
  });
});

// ===========================================================================
describe("finding 3: self-granted acceptance is not mirrored", () => {
  it("adding a stranger as 'accepted' does not mirror to the victim",
      async () => {
        const victimBefore = await user(A);
        await clientUpdateUser(E, (d) => {
          d.friends[A] = accepted(`${A}@example.com`, 0);
          return d;
        });
        expect(await user(A)).toEqual(victimBefore);
      });

  it("requester cannot self-accept their own outgoing request", async () => {
    // alice -> dave is pending; alice flips her own entry to accepted.
    await clientUpdateUser(A, (d) => {
      d.friends[D] = accepted(`${D}@example.com`, 0);
      return d;
    });
    expect((await user(D)).friends[A].status).toBe("incoming");
  });
});

// ===========================================================================
describe("behavior change: trips with friends who aren't friends", () => {
  it("no ghost balance entries between non-friends; history kept",
      async () => {
        // alice is friends with bob and carol; bob and carol are not.
        await db.doc(`Users/${A}`).update({
          [`friends.${C}`]: accepted(`${C}@example.com`, 0)});
        await db.doc(`Users/${C}`).update({
          [`friends.${A}`]: accepted(`${A}@example.com`, 0)});
        const id = await clientCreateTransaction(tripPayload({creator: A,
          driver: B, friends: [B, C], cost: 30}));
        // alice <-> bob applied (alice owes bob 10)
        expect((await user(A)).friends[B].balance).toBeCloseTo(2.5);
        expect((await user(B)).friends[A].balance).toBeCloseTo(-2.5);
        // bob <-> carol skipped: no status-less ghost entries
        expect((await user(B)).friends[C]).toBeUndefined();
        expect((await user(C)).friends[B]).toBeUndefined();
        // carol still gets the trip in her history and a notification
        expect((await user(C)).transactions).toEqual([id]);
        expect(sentMessages().map((m) => m.to).sort())
            .toEqual([TOKEN(B), TOKEN(C)].sort());
      });
});
