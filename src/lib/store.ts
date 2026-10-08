import { buildExample } from "@/lib/example"
import type {
  AppState,
  CheckWindow,
  CutRecord,
  Person,
  Subscription,
  SubscriptionStatus,
} from "@/lib/types"
import { EMPTY_STATE } from "@/lib/types"
import { addDays, mondayOf, todayISO } from "@/lib/time"

const STORAGE_KEY = "deolgi.v1"

export type Snapshot = {
  ready: boolean
  error: string | null
  state: AppState
}

export type ActionResult =
  | { ok: true }
  | { ok: false; reason: "not-ready" | "week-done" | "invalid" }

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  error: null,
  state: EMPTY_STATE,
}

let snapshot: Snapshot = SERVER_SNAPSHOT
let hydrated = false
const listeners = new Set<() => void>()

let watchingStorage = false

// 다른 탭에서 기록을 바꾸면 이 탭도 같은 기록을 보여 줍니다.
function watchOtherTabs() {
  if (watchingStorage || typeof window === "undefined") return
  watchingStorage = true
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    snapshot = readStoredSnapshot()
    emit()
  })
}

export function subscribe(listener: () => void): () => void {
  watchOtherTabs()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): Snapshot {
  ensureHydrated()
  return snapshot
}

export function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT
}

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(state: AppState) {
  snapshot = { ready: true, error: null, state }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장소가 막힌 브라우저에서도 이 탭 안에서는 계속 씁니다.
    }
  }
  emit()
}

// 바로 앞의 변경을 되돌리는 함수를 돌려줍니다. 그 사이 다른 변경이 있었으면 되돌리지 않습니다.
export function withUndo(run: () => void): (() => boolean) | null {
  const before = readyState()
  if (!before) return null
  run()
  const after = snapshot.state
  if (after === before) return null
  return () => {
    if (snapshot.state !== after) return false
    commit(before)
    return true
  }
}

const EXPORT_APP = "deolgi"

export function exportBackup(now = new Date()): string | null {
  const state = readyState()
  if (!state) return null
  return JSON.stringify({ app: EXPORT_APP, version: 1, exportedAt: now.toISOString(), state }, null, 2)
}

export function parseBackup(text: string): AppState | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (isRecord(parsed) && parsed.app === EXPORT_APP) return normalizeState(parsed.state)
    return normalizeState(parsed)
  } catch {
    return null
  }
}

export function importBackup(text: string): ActionResult {
  if (!snapshot.ready) return { ok: false, reason: "not-ready" }
  const state = parseBackup(text)
  if (!state) return { ok: false, reason: "invalid" }
  commit(state)
  return { ok: true }
}

function readyState(): AppState | null {
  if (!snapshot.ready || snapshot.error) return null
  return snapshot.state
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function readWindow(value: unknown): CheckWindow | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const label = readString(value.label)
  const time = readString(value.time)
  if (!id || !label || !time || typeof value.enabled !== "boolean") return null
  if (!/^\d{2}:\d{2}$/.test(time)) return null
  return { id, label, time, enabled: value.enabled }
}

function readSubscription(value: unknown): Subscription | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const name = readString(value.name)
  const status = readString(value.status)
  if (!id || !name) return null
  if (
    status !== "active" &&
    status !== "review" &&
    status !== "canceling" &&
    status !== "canceled"
  ) {
    return null
  }
  if (typeof value.amount !== "number" || typeof value.billingDay !== "number") return null
  return {
    id,
    name,
    amount: value.amount,
    billingDay: value.billingDay,
    status,
    category: readString(value.category),
    cancelUrl: readString(value.cancelUrl),
    note: readString(value.note) ?? "",
  }
}

function readPerson(value: unknown): Person | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const name = readString(value.name)
  const relation = readString(value.relation)
  const nextAt = readString(value.nextAt)
  if (!id || !name || !relation || !nextAt) return null
  if (typeof value.cadenceDays !== "number") return null
  return {
    id,
    name,
    relation,
    cadenceDays: value.cadenceDays,
    nextAt,
    lastMetAt: readString(value.lastMetAt),
    note: readString(value.note) ?? "",
  }
}

function readCut(value: unknown): CutRecord | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const weekOf = readString(value.weekOf)
  const title = readString(value.title)
  if (!id || !weekOf || !title || typeof value.done !== "boolean") return null
  if (!Array.isArray(value.steps) || !value.steps.every((step) => typeof step === "string")) {
    return null
  }
  return {
    id,
    weekOf,
    catalogId: readString(value.catalogId),
    subscriptionId: readString(value.subscriptionId),
    title,
    steps: value.steps,
    href: readString(value.href),
    hrefLabel: readString(value.hrefLabel),
    done: value.done,
  }
}

function readList<T>(value: unknown, read: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null
  return value.flatMap((item) => {
    const parsed = read(item)
    return parsed ? [parsed] : []
  })
}

export function normalizeState(value: unknown): AppState | null {
  if (!isRecord(value)) return null
  const windows = readList(value.windows, readWindow)
  const subscriptions = readList(value.subscriptions, readSubscription)
  const people = readList(value.people, readPerson)
  const cuts = readList(value.cuts, readCut)
  if (!windows || !subscriptions || !people || !cuts) return null
  return {
    windows,
    subscriptions,
    people,
    cuts,
    notificationsEnabled: value.notificationsEnabled === true,
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  snapshot = readStoredSnapshot()
}

function readStoredSnapshot(): Snapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ready: true, error: null, state: EMPTY_STATE }
    const parsed: unknown = JSON.parse(raw)
    const state = normalizeState(parsed)
    if (!state) {
      return {
        ready: true,
        error: "이 브라우저에 저장된 기록을 읽지 못했습니다.",
        state: EMPTY_STATE,
      }
    }
    return { ready: true, error: null, state }
  } catch {
    return {
      ready: true,
      error: "이 브라우저에 저장된 기록을 읽지 못했습니다.",
      state: EMPTY_STATE,
    }
  }
}

export function hydrateFromStorage() {
  ensureHydrated()
}

export function clearStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }
  snapshot = { ready: true, error: null, state: EMPTY_STATE }
  emit()
}

export function loadExample() {
  const current = readyState()
  const notificationsEnabled = current?.notificationsEnabled ?? false
  commit({ ...buildExample(), notificationsEnabled })
}

export function setNotificationsEnabled(enabled: boolean) {
  const state = readyState()
  if (!state) return
  commit({ ...state, notificationsEnabled: enabled })
}

export function addWindow(windowItem: Omit<CheckWindow, "id">): ActionResult {
  const state = readyState()
  if (!state) return { ok: false, reason: "not-ready" }
  if (state.windows.length >= 5) return { ok: false, reason: "invalid" }
  commit({
    ...state,
    windows: [...state.windows, { ...windowItem, id: crypto.randomUUID() }],
  })
  return { ok: true }
}

export function updateWindow(id: string, patch: Partial<Omit<CheckWindow, "id">>) {
  const state = readyState()
  if (!state) return
  commit({
    ...state,
    windows: state.windows.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  })
}

export function removeWindow(id: string) {
  const state = readyState()
  if (!state) return
  commit({ ...state, windows: state.windows.filter((item) => item.id !== id) })
}

export function fillSuggestedWindows() {
  const state = readyState()
  if (!state) return
  commit({
    ...state,
    windows: [
      { id: crypto.randomUUID(), label: "아침", time: "08:30", enabled: true },
      { id: crypto.randomUUID(), label: "점심", time: "12:40", enabled: true },
      { id: crypto.randomUUID(), label: "퇴근 전", time: "18:10", enabled: true },
    ],
  })
}

export function addSubscription(input: Omit<Subscription, "id">): ActionResult {
  const state = readyState()
  if (!state || !input.name.trim() || input.amount < 0) return { ok: false, reason: "invalid" }
  commit({
    ...state,
    subscriptions: [...state.subscriptions, { ...input, id: crypto.randomUUID() }],
  })
  return { ok: true }
}

export function addSubscriptions(inputs: Omit<Subscription, "id">[]): number {
  const state = readyState()
  if (!state) return 0
  const valid = inputs.filter((input) => input.name.trim() && input.amount >= 0)
  if (valid.length === 0) return 0
  commit({
    ...state,
    subscriptions: [
      ...state.subscriptions,
      ...valid.map((input) => ({ ...input, id: crypto.randomUUID() })),
    ],
  })
  return valid.length
}

export function updateSubscription(id: string, patch: Partial<Omit<Subscription, "id">>) {
  const state = readyState()
  if (!state) return
  commit({
    ...state,
    subscriptions: state.subscriptions.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    ),
  })
}

export function setSubscriptionStatus(id: string, status: SubscriptionStatus) {
  updateSubscription(id, { status })
}

export function removeSubscription(id: string) {
  const state = readyState()
  if (!state) return
  commit({
    ...state,
    subscriptions: state.subscriptions.filter((item) => item.id !== id),
  })
}

export function addPerson(input: Omit<Person, "id">): ActionResult {
  const state = readyState()
  if (!state || !input.name.trim()) return { ok: false, reason: "invalid" }
  commit({
    ...state,
    people: [...state.people, { ...input, id: crypto.randomUUID() }],
  })
  return { ok: true }
}

export function updatePerson(id: string, patch: Partial<Omit<Person, "id">>) {
  const state = readyState()
  if (!state) return
  commit({
    ...state,
    people: state.people.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  })
}

export function removePerson(id: string) {
  const state = readyState()
  if (!state) return
  commit({ ...state, people: state.people.filter((item) => item.id !== id) })
}

export function markPersonMet(id: string, now = new Date()) {
  const state = readyState()
  if (!state) return
  const today = todayISO(now)
  commit({
    ...state,
    people: state.people.map((person) =>
      person.id === id
        ? {
            ...person,
            lastMetAt: today,
            nextAt: addDays(today, Math.max(1, person.cadenceDays)),
          }
        : person,
    ),
  })
}

export function snoozePerson(id: string, now = new Date()) {
  const state = readyState()
  if (!state) return
  const today = todayISO(now)
  commit({
    ...state,
    people: state.people.map((person) => {
      if (person.id !== id) return person
      const base = person.nextAt > today ? person.nextAt : today
      return { ...person, nextAt: addDays(base, 7) }
    }),
  })
}

export function setWeeklyCut(
  input: Omit<CutRecord, "id" | "weekOf" | "done">,
  now = new Date(),
): ActionResult {
  const state = readyState()
  if (!state) return { ok: false, reason: "not-ready" }
  const weekOf = mondayOf(now)
  const existing = state.cuts.find((cut) => cut.weekOf === weekOf)
  if (existing?.done) return { ok: false, reason: "week-done" }
  const next: CutRecord = {
    ...input,
    id: existing?.id ?? crypto.randomUUID(),
    weekOf,
    done: false,
  }
  commit({
    ...state,
    cuts: existing
      ? state.cuts.map((cut) => (cut.weekOf === weekOf ? next : cut))
      : [...state.cuts, next],
  })
  return { ok: true }
}

export function markCutDone(now = new Date()) {
  const state = readyState()
  if (!state) return
  const weekOf = mondayOf(now)
  commit({
    ...state,
    cuts: state.cuts.map((cut) => (cut.weekOf === weekOf ? { ...cut, done: true } : cut)),
  })
}

export function undoCutDone(now = new Date()) {
  const state = readyState()
  if (!state) return
  const weekOf = mondayOf(now)
  commit({
    ...state,
    cuts: state.cuts.map((cut) => (cut.weekOf === weekOf ? { ...cut, done: false } : cut)),
  })
}
