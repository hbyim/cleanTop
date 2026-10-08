import { describe, expect, it } from "vitest"
import { upcomingBillings, yearlyTotal } from "@/lib/select"
import { nextBillingDate } from "@/lib/time"
import type { Subscription } from "@/lib/types"

function sub(name: string, amount: number, billingDay: number, status: Subscription["status"] = "active"): Subscription {
  return { id: name, name, amount, billingDay, status, category: null, cancelUrl: null, note: "" }
}

describe("nextBillingDate", () => {
  it("이번 달 결제일이 남아 있으면 이번 달", () => {
    expect(nextBillingDate(12, "2026-10-08")).toBe("2026-10-12")
  })

  it("오늘이 결제일이면 오늘", () => {
    expect(nextBillingDate(8, "2026-10-08")).toBe("2026-10-08")
  })

  it("지났으면 다음 달", () => {
    expect(nextBillingDate(3, "2026-10-08")).toBe("2026-11-03")
  })

  it("31일 결제는 짧은 달의 마지막 날로", () => {
    expect(nextBillingDate(31, "2026-11-05")).toBe("2026-11-30")
    expect(nextBillingDate(31, "2027-01-31")).toBe("2027-01-31")
    expect(nextBillingDate(30, "2027-01-31")).toBe("2027-02-28")
  })

  it("연말을 넘기면 다음 해", () => {
    expect(nextBillingDate(1, "2026-12-15")).toBe("2027-01-01")
  })
})

describe("upcomingBillings", () => {
  it("해지한 구독은 빼고 가까운 순으로", () => {
    const list = upcomingBillings(
      [sub("a", 1000, 20), sub("b", 2000, 10), sub("c", 3000, 9, "canceled"), sub("d", 500, 9)],
      "2026-10-08",
      7,
    )
    expect(list.map((item) => [item.subscription.id, item.daysLeft])).toEqual([
      ["d", 1],
      ["b", 2],
    ])
  })
})

describe("yearlyTotal", () => {
  it("해지하지 않은 구독의 한 달 합계 × 12", () => {
    expect(yearlyTotal([sub("a", 1000, 1), sub("b", 500, 1, "canceled")])).toBe(12000)
  })
})
