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
  transactions: Transaction[]
  uid: string
  firstName: string
  lastName: string
  notificationToken?: string
  splitwiseUID?: string
}

interface Waypoint {
  latitude: number
  longitude: number
}

export interface Transaction {
  amount: number
  cost: number
  country: "CA" | "US"
  creator: string
  date: Date
  distance: number
  startLocation: string
  endLocation: string
  payeers: string[]
  payee: string
  splitType: "full" | "split"
  type: string
  users: string[]
  waypoints: Waypoint[]
}
