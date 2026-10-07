import { findService } from "@/lib/catalog"
import type { AppState, Subscription } from "@/lib/types"
import { addDays, todayISO } from "@/lib/time"

function subscription(
  name: string,
  amount: number,
  billingDay: number,
  status: Subscription["status"],
  note: string,
): Subscription {
  const service = findService(name)
  return {
    id: crypto.randomUUID(),
    name: service?.name ?? name,
    amount,
    billingDay,
    status,
    category: service?.category ?? null,
    cancelUrl: service?.cancelUrl ?? null,
    note,
  }
}

export function buildExample(now = new Date()): AppState {
  const today = todayISO(now)
  return {
    notificationsEnabled: false,
    windows: [
      { id: crypto.randomUUID(), label: "아침", time: "08:30", enabled: true },
      { id: crypto.randomUUID(), label: "점심", time: "12:40", enabled: true },
      { id: crypto.randomUUID(), label: "퇴근 전", time: "18:10", enabled: true },
    ],
    subscriptions: [
      subscription("넷플릭스", 17000, 3, "active", ""),
      subscription("유튜브 프리미엄", 14900, 12, "active", ""),
      subscription("멜론", 10900, 21, "review", "최근 한 달 동안 열지 않음"),
      subscription("쿠팡 와우", 7890, 7, "review", "배송을 거의 쓰지 않음"),
      subscription("iCloud", 1100, 1, "active", "사진이 들어 있어 유지"),
      subscription("ChatGPT", 29000, 15, "active", ""),
    ],
    people: [
      {
        id: crypto.randomUUID(),
        name: "엄마",
        relation: "가족",
        cadenceDays: 7,
        nextAt: addDays(today, 1),
        lastMetAt: addDays(today, -6),
        note: "저녁에 전화",
      },
      {
        id: crypto.randomUUID(),
        name: "지수",
        relation: "친구",
        cadenceDays: 14,
        nextAt: addDays(today, -2),
        lastMetAt: addDays(today, -16),
        note: "아프면 서로 연락하기로 함",
      },
    ],
    cuts: [],
  }
}
