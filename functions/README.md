# Firebase Functions

This directory contains the code associated with this project's Firebase Function infrastructure. These functions are used to run server-side updates in response to Firestore document changes due to the user. The three Functions at the moment are `sendTransactionNotifications`, `aggregateBalances` and `updateFriendsList`.

## `sendTransactionNotifications`

This function is responsible for sending out notifications to each user involved in a transaction other than its creator. It does this through the `expo-server-sdk` by reading the `notificationToken` property on each User's Firestore document and requesting the sdk to send out a notification informing them of the new transaction.


## `aggregateBalances`

This function is responsible for updating the current balances of each friend when a new transaction/trip is created. To do this it splits the `cost` based on the `splitType` assigned to the transaction and then increases the amount owed to the driver on each `payer`'s friend balances, and decrements the balance on the driver's balances for each friend.

## `updateFriendsList`

This function is responsible for managing friend requests in the system.

Each user has a `friends` property which contains a map between their friend's UID and values associated with that friend. The most important value is their `balance` which represents the current owed amount for that friend. Friend request logic is done through utilizing the `status` property which is a enum of outgoing, incoming, and accepted. Each time this status changes the appropriate Firebase function will fire to update the related friend's status accordingly.


## Development

To start an interactive shell to test the functions, run `npm run shell`. This shell will allow you to call your handler functions directly and then watch how it updates the documents in Firestore.

An example invocation could be:
```
aggregateBalances({ payeeUID: 'foo', payers: ['bar'], cost: 100, amount: 100, splitType: 'split' })
```
or
```
sendTransactionNotifications({ payeeUID: 'VMDgsjEqLxc0qBO8hzLmKrz8MKs1', payers: ['UIrBmJyi31hxTEt52MkqCF7Vjgg1', 'UvousU6NpccuLdltaUeNbfK0oNF2'], cost: 100, amount: 100, splitType: 'split', creator: 'VMDgsjEqLxc0qBO8hzLmKrz8MKs1' })
```
or
```
updateFriendsList({
  before: {
    uid: 'LH4gkGLhXnS20cHSIwvGkIzV7Tw2',
    friends: {},
    email: 'verify4@melen.com'
  },
  after: {
    uid: 'LH4gkGLhXnS20cHSIwvGkIzV7Tw2',
    friends: { 
      __TEMPxxxxxx: {
        status: 'outgoing',
        balance: 0,
        accepted: false,
        email: 'new@matt.com'  
      }
    },
    email: 'verify4@melen.com'
  }
})
```
or
```
updateFriendsList({
  before: {
    uid: 'Ftom0KXgqQTo5Pbq7gArtQAJr1B2',
    friends: { 
      'LH4gkGLhXnS20cHSIwvGkIzV7Tw2': {
        status: 'incoming',
        balance: 0,
        accepted: false
      }
    }
  },
  after: {
    uid: 'Ftom0KXgqQTo5Pbq7gArtQAJr1B2',
    friends: { 
      'LH4gkGLhXnS20cHSIwvGkIzV7Tw2': {
        status: 'accepted',
        balance: 0,
        accepted: true  
      }
    }
  }
})
```

## Deployment

To deploy to the development Firebase environment run `npm run deploy`, and to deploy to the production Firebase environment run `npm run deploy:production`
