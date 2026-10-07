export type SubscriptionStatus = "active" | "review" | "canceling" | "canceled"

export type CheckWindow = {
  id: string
  label: string
  time: string
  enabled: boolean
}

export type Subscription = {
  id: string
  name: string
  amount: number
  billingDay: number
  status: SubscriptionStatus
  category: string | null
  cancelUrl: string | null
  note: string
}

export type Person = {
  id: string
  name: string
  relation: string
  cadenceDays: number
  nextAt: string
  lastMetAt: string | null
  note: string
}

export type CutRecord = {
  id: string
  weekOf: string
  catalogId: string | null
  subscriptionId: string | null
  title: string
  steps: string[]
  href: string | null
  hrefLabel: string | null
  done: boolean
}

export type AppState = {
  windows: CheckWindow[]
  subscriptions: Subscription[]
  people: Person[]
  cuts: CutRecord[]
  notificationsEnabled: boolean
}

export const EMPTY_STATE: AppState = {
  windows: [],
  subscriptions: [],
  people: [],
  cuts: [],
  notificationsEnabled: false,
}
