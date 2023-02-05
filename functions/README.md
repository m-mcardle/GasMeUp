# Firebase Functions

This directory contains the code associated with this project's Firebase Function infrastructure. These functions are used to run server-side updates in response to Firestore document changes due to the user. The two Functions at the moment are `aggregateBalances` and `updateFriendsList`.


## `aggregateBalances`

This function is responsible for updating the current balances of each friend when a new transaction/trip is created. To do this it splits the `cost` based on the `splitType` assigned to the transaction and then increases the amount owed to the driver on each `payer`'s friend balances, and decrements the balance on the driver's balances for each friend.

## `updateFriendsList`

This function is responsible for managing friend requests in the system.

Each user has 3 fields associated with friends: `outgoingFriendRequests`, `incomingFriendRequests`, and `friends`. `outgoingFriendRequests` and `incomingFriendRequests` just store an array of user IDs whereas `friends` is an object with keys for each friend's ID and a number indicating the current balance between them.

Each time a friend is added to `outgoingFriendRequests`, the function finds this friend and adds the invoking user's ID to their `incomingFriendRequests`. When a friend request is accepted and a new entry is added to a user's `friends` object, the function then adds the invoking user to the added friend's `friends` object and then removes the relevant entries in each of their `outgoingFriendRequests` and `incomingFriendRequests`.


## Development

To start an interactive shell to test the functions, run `npm run shell`. This shell will allow you to call your handler functions directly and then watch how it updates the documents in Firestore.

An example invocation could be:
```
aggregateBalances({ payeeUID: 'foo', payers: ['bar'], cost: 100, amount: 100, splitType: 'split' })
```


## Deployment

To deploy to the development Firebase environment run `npm run build`, and to deploy to the production Firebase environment run `npm run build:production`
