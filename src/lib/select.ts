import type { CutRecord, Person, Subscription } from "@/lib/types"
import { diffDays, mondayOf, nextBillingDate } from "@/lib/time"

export function monthlyTotal(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((item) => item.status !== "canceled")
    .reduce((sum, item) => sum + item.amount, 0)
}

export function yearlyTotal(subscriptions: Subscription[]): number {
  return monthlyTotal(subscriptions) * 12
}

export type UpcomingBilling = {
  subscription: Subscription
  date: string
  daysLeft: number
}

export function upcomingBillings(
  subscriptions: Subscription[],
  today: string,
  withinDays = 7,
): UpcomingBilling[] {
  return subscriptions
    .filter((item) => item.status !== "canceled")
    .map((subscription) => {
      const date = nextBillingDate(subscription.billingDay, today)
      return { subscription, date, daysLeft: diffDays(today, date) }
    })
    .filter((item) => item.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.subscription.amount - a.subscription.amount)
}

export function subscriptionsToReview(subscriptions: Subscription[]): Subscription[] {
  return subscriptions
    .filter((item) => item.status === "review" || item.status === "canceling")
    .sort((a, b) => b.amount - a.amount)
}

export function sortSubscriptions(subscriptions: Subscription[]): Subscription[] {
  const rank = { review: 0, canceling: 1, active: 2, canceled: 3 }
  return subscriptions.slice().sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status]
    if (byStatus !== 0) return byStatus
    return b.amount - a.amount
  })
}

export function sortPeople(people: Person[]): Person[] {
  return people.slice().sort((a, b) => a.nextAt.localeCompare(b.nextAt))
}

export function currentCut(cuts: CutRecord[], now: Date): CutRecord | null {
  const week = mondayOf(now)
  return cuts.find((cut) => cut.weekOf === week) ?? null
}

export function pastCuts(cuts: CutRecord[], now: Date): CutRecord[] {
  const week = mondayOf(now)
  return cuts
    .filter((cut) => cut.done && cut.weekOf < week)
    .sort((a, b) => b.weekOf.localeCompare(a.weekOf))
    .slice(0, 4)
}

export function isBlankState(state: {
  windows: unknown[]
  subscriptions: unknown[]
  people: unknown[]
  cuts: unknown[]
}): boolean {
  return (
    state.windows.length === 0 &&
    state.subscriptions.length === 0 &&
    state.people.length === 0 &&
    state.cuts.length === 0
  )
}
