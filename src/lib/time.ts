import type { CheckWindow } from "@/lib/types"

export const WINDOW_MINUTES = 20

export function formatISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year || 0, (month || 1) - 1, day || 1)
}

export function todayISO(now = new Date()): string {
  return formatISODate(now)
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return formatISODate(date)
}

export function mondayOf(now = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekday = date.getDay()
  const diff = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + diff)
  return formatISODate(date)
}

export function diffDays(fromISO: string, toISO: string): number {
  const from = parseISODate(fromISO).getTime()
  const to = parseISODate(toISO).getTime()
  return Math.round((to - from) / 86_400_000)
}

export function formatFullDate(now: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now)
}

export function formatMonthDay(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseISODate(iso))
}

export function formatRelativeDay(iso: string, today: string): string {
  const diff = diffDays(today, iso)
  if (diff === 0) return "오늘"
  if (diff === 1) return "내일"
  if (diff === 2) return "모레"
  if (diff === -1) return "어제"
  if (diff < 0) return `${Math.abs(diff)}일 지남`
  return `${diff}일 뒤`
}

export function formatKoreanTime(hhmm: string): string {
  const parsed = parseTime(hhmm)
  if (parsed === null) return hhmm
  const hour24 = Math.floor(parsed / 60)
  const minute = parsed % 60
  const period = hour24 < 12 ? "오전" : "오후"
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${period} ${hour}:${String(minute).padStart(2, "0")}`
}

export function formatWon(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "곧"
  if (minutes < 60) return `${minutes}분 뒤`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}시간 뒤` : `${hours}시간 ${rest}분 뒤`
}

export function formatCadence(days: number): string {
  if (days === 7) return "일주일에 한 번"
  if (days === 14) return "2주에 한 번"
  if (days === 30) return "한 달에 한 번"
  return `${days}일마다`
}

export function parseTime(hhmm: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

export type WindowStatus =
  | { kind: "none" }
  | { kind: "now"; window: CheckWindow; minutesLeft: number }
  | {
      kind: "later"
      window: CheckWindow
      minutesUntil: number
      tomorrow: boolean
    }

export function enabledWindows(windows: CheckWindow[]): CheckWindow[] {
  return windows
    .filter((window) => window.enabled && parseTime(window.time) !== null)
    .slice()
    .sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0))
}

export function describeWindows(windows: CheckWindow[], now: Date): WindowStatus {
  const enabled = enabledWindows(windows)
  if (enabled.length === 0) return { kind: "none" }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  for (const window of enabled) {
    const start = parseTime(window.time) ?? 0
    const end = start + WINDOW_MINUTES
    if (nowMinutes >= start && nowMinutes < end) {
      return { kind: "now", window, minutesLeft: end - nowMinutes }
    }
  }

  for (const window of enabled) {
    const start = parseTime(window.time) ?? 0
    if (start > nowMinutes) {
      return {
        kind: "later",
        window,
        minutesUntil: start - nowMinutes,
        tomorrow: false,
      }
    }
  }

  const first = enabled[0]
  const start = parseTime(first.time) ?? 0
  return {
    kind: "later",
    window: first,
    minutesUntil: 24 * 60 - nowMinutes + start,
    tomorrow: true,
  }
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// 결제일이 그 달에 없으면(31일 등) 그 달 마지막 날로 봅니다.
export function nextBillingDate(billingDay: number, today: string): string {
  const base = parseISODate(today)
  const year = base.getFullYear()
  const month = base.getMonth()
  const thisMonth = new Date(year, month, Math.min(billingDay, daysInMonth(year, month)))
  if (formatISODate(thisMonth) >= today) return formatISODate(thisMonth)
  const next = new Date(year, month + 1, Math.min(billingDay, daysInMonth(year, month + 1)))
  return formatISODate(next)
}
