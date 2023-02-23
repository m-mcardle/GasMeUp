export interface Friend {
  status: string
  accepted: boolean
  balance: number
  email: string
}

export interface FriendsField {
  [key: string]: Friend
}

export interface User {
  email: string
  friends: FriendsField
  transactions: any[]
  uid: string
  firstName: string
  lastName: string
  notificationToken?: string
  splitwiseUID?: string
}
