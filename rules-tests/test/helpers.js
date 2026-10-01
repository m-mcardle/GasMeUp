// Shared fixtures for the emulator suites.
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

export const PROJECT_ID = "demo-gasmeup";
export const EMULATOR_HOST = "127.0.0.1";
export const EMULATOR_PORT = 8181;

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Rules under test. Defaults to the repo's firestore.rules; set RULES_FILE to
 * run the same suite against another version (e.g. the pre-hardening rules).
 */
export function loadRules() {
  const file = process.env.RULES_FILE ?
    path.resolve(process.env.RULES_FILE) :
    path.resolve(here, "../../firestore.rules");
  return readFileSync(file, "utf8");
}

export const A = "alice";
export const B = "bob";
export const C = "carol";
export const D = "dave";
export const E = "eve"; // attacker, no relationships
export const G = "ghost"; // legacy "ghost" balance entry with alice

export const TOKEN = (uid) => `ExponentPushToken[${uid}]`;

/** Build a `Users` doc as the app creates it (SignUpScreen). */
export function userDoc(uid, friends = {}, transactions = []) {
  return {
    uid,
    email: `${uid}@example.com`,
    firstName: uid[0].toUpperCase() + uid.slice(1),
    lastName: "Test",
    transactions,
    friends,
    notificationToken: TOKEN(uid),
  };
}

export const accepted = (email, balance = 0) =>
  ({status: "accepted", accepted: true, balance, email});
export const outgoing = (email) =>
  ({status: "outgoing", accepted: false, balance: 0, email});
export const incoming = (email) =>
  ({status: "incoming", accepted: false, balance: 0, email});

/**
 * The seeded world:
 *  - alice <-> bob accepted friends; bob owes alice 12.50
 *  - carol sent alice a request (carol: outgoing, alice: incoming)
 *  - alice sent dave a request (alice: outgoing, dave: incoming)
 *  - alice <-> ghost legacy entries with only a balance (pre-fix
 *    aggregateBalances between non-friends)
 *  - eve has nobody
 */
export function seedUsers() {
  return {
    [A]: userDoc(A, {
      [B]: accepted(`${B}@example.com`, 12.5),
      [C]: incoming(`${C}@example.com`),
      [D]: outgoing(`${D}@example.com`),
      [G]: {balance: 3},
    }),
    [B]: userDoc(B, {[A]: accepted(`${A}@example.com`, -12.5)}),
    [C]: userDoc(C, {[A]: outgoing(`${A}@example.com`)}),
    [D]: userDoc(D, {[A]: incoming(`${A}@example.com`)}),
    [E]: userDoc(E),
    [G]: userDoc(G, {[A]: {balance: -3}}),
  };
}

/** Trip payload exactly as SaveTripScreen builds it. */
export function tripPayload({creator, driver, friends, cost = 30,
  splitType = "split", date = new Date()}) {
  const userIsDriver = driver === creator;
  const payers = userIsDriver ?
    friends :
    [creator, ...friends.filter((f) => f !== driver)];
  const amount = splitType === "full" ?
    Number((cost / payers.length).toFixed(2)) :
    Number((cost / (payers.length + 1)).toFixed(2));
  return {
    cost: Number(cost.toFixed(2)),
    amount,
    payeeUID: String(driver),
    payers,
    splitType,
    distance: 42,
    gasPrice: 1.6,
    startLocation: "Start",
    endLocation: "End",
    gasMileage: 8.5,
    date,
    creator,
    users: [creator, ...friends],
    waypoints: [{latitude: 1, longitude: 2}],
    country: "CA",
    type: "trip",
  };
}

/** Settle-up payload exactly as FriendInfoScreen builds it. */
export function settlePayload({creator, friend, amount, date = new Date()}) {
  return {
    amount: amount * -1,
    cost: amount * -1,
    payeeUID: creator,
    payers: [friend],
    date,
    users: [creator, friend],
    type: "settle",
    splitType: "full",
    distance: 0,
    gasPrice: 0,
    creator,
  };
}
