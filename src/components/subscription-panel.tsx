"use client"

import { useState } from "react"
import { act } from "@/components/act"
import { ExternalLink } from "@/components/external-link"
import { controlClass, Field } from "@/components/field"
import { Ready } from "@/components/ready"
import { useNow } from "@/components/use-now"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { findService, normalizeName } from "@/lib/catalog"
import { parseReceipt, type ParsedLine } from "@/lib/parse-receipt"
import { monthlyTotal, sortSubscriptions, yearlyTotal } from "@/lib/select"
import {
  addSubscription,
  addSubscriptions,
  removeSubscription,
  setSubscriptionStatus,
  setWeeklyCut,
  updateSubscription,
} from "@/lib/store"
import type { AppState, Subscription, SubscriptionStatus } from "@/lib/types"
import { showToast } from "@/lib/toast"
import { diffDays, formatRelativeDay, formatWon, nextBillingDate, todayISO } from "@/lib/time"
import { cn } from "cn"

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "유지",
  review: "살펴보기",
  canceling: "해지 예정",
  canceled: "해지함",
}

type Filter = "all" | SubscriptionStatus

const FILTERS: Filter[] = ["all", "review", "canceling", "active", "canceled"]

type Draft = {
  id: string | null
  name: string
  amount: string
  billingDay: string
  status: SubscriptionStatus
  note: string
}

const EMPTY_DRAFT: Draft = {
  id: null,
  name: "",
  amount: "",
  billingDay: "",
  status: "active",
  note: "",
}

export function SubscriptionPanel() {
  return (
    <Ready>
      {(state) => <Editor state={state} />}
    </Ready>
  )
}

function Editor({ state }: { state: AppState }) {
  const now = useNow()
  const today = now ? todayISO(now) : null
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<Filter>("all")
  const [receipt, setReceipt] = useState("")
  const [parsed, setParsed] = useState<ParsedLine[] | null>(null)
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const items = sortSubscriptions(state.subscriptions)
  const visible = filter === "all" ? items : items.filter((item) => item.status === filter)
  const total = monthlyTotal(state.subscriptions)
  const reviewCount = items.filter(
    (item) => item.status === "review" || item.status === "canceling",
  ).length
  const matched = draft ? findService(draft.name) : undefined

  function countOf(value: Filter): number {
    return value === "all" ? items.length : items.filter((item) => item.status === value).length
  }

  function openCreate() {
    setErrors({})
    setDraft(EMPTY_DRAFT)
  }

  function openEdit(item: Subscription) {
    setErrors({})
    setDraft({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      billingDay: String(item.billingDay),
      status: item.status,
      note: item.note,
    })
  }

  function saveDraft() {
    if (!draft) return
    const nextErrors: Record<string, string> = {}
    const amount = Number(draft.amount.replace(/[,원\s]/g, ""))
    const billingDay = Number(draft.billingDay.replace(/[일\s]/g, ""))
    if (!draft.name.trim()) nextErrors.name = "이름을 적어 주세요."
    if (!draft.amount.trim() || !Number.isFinite(amount) || amount < 0) {
      nextErrors.amount = "금액을 숫자로 적어 주세요."
    }
    if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
      nextErrors.billingDay = "결제일은 1일부터 31일 사이입니다."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const service = findService(draft.name)
    const payload = {
      name: (service?.name ?? draft.name).trim(),
      amount,
      billingDay,
      status: draft.status,
      category: service?.category ?? null,
      cancelUrl: service?.cancelUrl ?? null,
      note: draft.note.trim(),
    }
    if (draft.id) {
      const id = draft.id
      act(`${payload.name} · 저장했습니다.`, () => updateSubscription(id, payload))
    } else {
      act(`${payload.name} · 추가했습니다.`, () => addSubscription(payload))
    }
    setDraft(null)
  }

  function removeDraft() {
    if (!draft?.id) return
    const id = draft.id
    const name = draft.name
    act(`${name} · 목록에서 지웠습니다. 실제 해지와는 별개입니다.`, () => removeSubscription(id))
    setDraft(null)
  }

  function inspectReceipt() {
    const lines = parseReceipt(receipt)
    const initial: Record<number, boolean> = {}
    lines.forEach((line, index) => {
      const duplicate = state.subscriptions.some(
        (item) => normalizeName(item.name) === normalizeName(line.name),
      )
      initial[index] = line.suggestion === "subscription" && line.amount !== null && !duplicate
    })
    setParsed(lines)
    setPicked(initial)
    if (lines.length === 0) showToast("붙여 넣은 내용에서 줄을 찾지 못했습니다.")
  }

  function addPicked() {
    if (!parsed) return
    const billingDay = now ? now.getDate() : 1
    const inputs = parsed.flatMap((line, index) => {
      if (!picked[index] || line.amount === null) return []
      return [
        {
          name: line.name,
          amount: line.amount,
          billingDay,
          status: "review" as const,
          category: line.category,
          cancelUrl: line.cancelUrl,
          note: "",
        },
      ]
    })
    if (inputs.length === 0) {
      showToast("선택한 항목이 없습니다.")
      return
    }
    let count = 0
    act(`${inputs.length}개를 살펴보기로 넣었습니다. 결제일은 오늘로 두었으니 수정에서 바꿔 주세요.`, () => {
      count = addSubscriptions(inputs)
    })
    if (count > 0) {
      setReceipt("")
      setParsed(null)
      setPicked({})
      setFilter("all")
    }
  }

  function chooseCut(item: Subscription) {
    const result = setWeeklyCut({
      catalogId: null,
      subscriptionId: item.id,
      title: `${item.name} 해지하기`,
      steps: [
        "해지 페이지를 엽니다. 로그인이 필요할 수 있습니다.",
        "해지를 확인합니다. 다음 결제일 전에 끝나는지 봅니다.",
        "돌아와서 이 구독 상태를 해지함으로 바꿉니다.",
      ],
      href: item.cancelUrl,
      hrefLabel: item.cancelUrl ? `${item.name} 해지 페이지` : null,
    })
    showToast(
      result.ok
        ? `${item.name} · 이번 주 끊을 것으로 정해 두었습니다.`
        : "이번 주는 이미 하나를 끝냈습니다. 다음 주에 또 고르면 됩니다.",
    )
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl tracking-tight">구독</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            카드 앱의 정기결제만 옮겨 적습니다. 실제 해지는 각 서비스 화면에서 합니다.
          </p>
        </div>
        <Button type="button" className="h-11 px-4" onClick={openCreate}>
          구독 추가
        </Button>
      </header>

      <section className="grid gap-1 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <p className="text-xs font-medium text-muted-foreground">해지하지 않은 구독</p>
        <p className="font-heading text-3xl tracking-tight tabular-nums">한 달 {formatWon(total)}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          1년이면 {formatWon(yearlyTotal(state.subscriptions))} · 살펴볼 항목 {reviewCount}개
        </p>
      </section>

      {items.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="상태별로 보기">
          {FILTERS.map((value) => {
            const count = countOf(value)
            if (value !== "all" && count === 0) return null
            const active = filter === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3 text-sm ring-1 ring-foreground/10",
                  active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all" ? "전체" : STATUS_LABEL[value]} {count}
              </button>
            )
          })}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8">
          <h2 className="font-heading text-2xl tracking-tight">적힌 구독이 없습니다.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            하나씩 추가하거나, 아래에 카드 내역을 붙여 넣으면 구독만 골라 줍니다.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">이 상태의 구독이 없습니다.</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((item) => {
            const nextDate = today && item.status !== "canceled" ? nextBillingDate(item.billingDay, today) : null
            const soon = nextDate && today ? diffDays(today, nextDate) <= 3 : false
            return (
              <li key={item.id} className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="grid text-left"
                    onClick={() => openEdit(item)}
                    aria-label={`${item.name} 수정`}
                  >
                    <span
                      className={
                        item.status === "canceled" ? "text-muted-foreground line-through" : "font-medium"
                      }
                    >
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      매월 {item.billingDay}일
                      {item.category ? ` · ${item.category}` : ""}
                      {nextDate && today ? (
                        <span className={cn(soon && "font-medium text-review-foreground")}>
                          {" "}
                          · 다음 결제 {formatRelativeDay(nextDate, today)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <p className="font-heading text-xl tabular-nums">{formatWon(item.amount)}</p>
                </div>
                {item.note ? <p className="mt-2 text-sm text-muted-foreground">{item.note}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${item.id}`}>
                    {item.name} 상태
                  </label>
                  <select
                    id={`status-${item.id}`}
                    className={`${controlClass} w-auto`}
                    value={item.status}
                    onChange={(event) =>
                      setSubscriptionStatus(item.id, event.target.value as SubscriptionStatus)
                    }
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {item.cancelUrl ? <ExternalLink href={item.cancelUrl}>해지 페이지</ExternalLink> : null}
                  {item.status !== "canceled" ? (
                    <Button type="button" variant="outline" onClick={() => chooseCut(item)}>
                      이번 주에 끊기
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={() => openEdit(item)}>
                    수정
                  </Button>
                </div>
                {!item.cancelUrl && item.status !== "canceled" ? (
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    해지 페이지를 찾지 못했습니다. 그 서비스의 구독 관리에서 직접 해지하면 됩니다.
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <details
        className="group rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10"
        open={items.length === 0 || undefined}
      >
        <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            카드 내역 붙여넣기로 한 번에 넣기
            <span className="text-muted-foreground group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </span>
        </summary>
        <div className="mt-3 grid gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            한 줄에 이름과 금액을 붙이면 구독처럼 보이는 항목만 골라 줍니다. 카페나 편의점 결제는
            빼 둡니다.
          </p>
          <Textarea
            value={receipt}
            onChange={(event) => setReceipt(event.target.value)}
            placeholder={"넷플릭스 17,000\n멜론 10,900\n스타벅스 6,500\n쿠팡 와우 7,890"}
            className="min-h-28"
            aria-label="카드 내역"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-fit px-4"
            onClick={inspectReceipt}
            disabled={!receipt.trim()}
          >
            살펴보기
          </Button>
          {parsed ? (
            <ul className="grid gap-2">
              {parsed.map((line, index) => {
                const duplicate = state.subscriptions.some(
                  (item) => normalizeName(item.name) === normalizeName(line.name),
                )
                const disabled = line.suggestion === "once" || line.amount === null || duplicate
                return (
                  <li key={`${line.raw}-${index}`}>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-primary"
                        checked={Boolean(picked[index]) && !disabled}
                        disabled={disabled}
                        onChange={(event) =>
                          setPicked((current) => ({ ...current, [index]: event.target.checked }))
                        }
                      />
                      <span className={cn("grid", disabled && "opacity-60")}>
                        <span>
                          {line.name}
                          {line.amount !== null ? (
                            <span className="ml-2 tabular-nums text-muted-foreground">
                              {formatWon(line.amount)}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {duplicate ? "이미 목록에 있습니다." : line.reason}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          ) : null}
          {parsed && parsed.length > 0 ? (
            <Button type="button" className="h-11 w-fit px-4" onClick={addPicked}>
              선택한 {Object.entries(picked).filter(([, value]) => value).length}개 넣기
            </Button>
          ) : null}
        </div>
      </details>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "구독 수정" : "구독 추가"}</DialogTitle>
            <DialogDescription>금액은 한 달 기준입니다. 해지와는 별도로 이 목록만 바뀝니다.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              saveDraft()
            }}
          >
            <Field label="이름" htmlFor="sub-name" error={errors.name}>
              <Input
                id="sub-name"
                value={draft?.name ?? ""}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, name: event.target.value } : current))
                }
                aria-invalid={Boolean(errors.name)}
                placeholder="넷플릭스"
                autoFocus={!draft?.id}
              />
            </Field>
            {matched ? (
              <p className="text-xs text-muted-foreground">
                {matched.name} 해지 페이지를 찾아 두었습니다.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Field label="한 달 금액" htmlFor="sub-amount" error={errors.amount}>
                <Input
                  id="sub-amount"
                  inputMode="numeric"
                  value={draft?.amount ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, amount: event.target.value } : current,
                    )
                  }
                  aria-invalid={Boolean(errors.amount)}
                  placeholder="17,000"
                />
              </Field>
              <Field label="결제일" htmlFor="sub-day" error={errors.billingDay}>
                <Input
                  id="sub-day"
                  inputMode="numeric"
                  value={draft?.billingDay ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, billingDay: event.target.value } : current,
                    )
                  }
                  aria-invalid={Boolean(errors.billingDay)}
                  placeholder="매월 3일이면 3"
                />
              </Field>
            </div>
            <Field label="상태" htmlFor="sub-status">
              <select
                id="sub-status"
                className={controlClass}
                value={draft?.status ?? "active"}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, status: event.target.value as SubscriptionStatus }
                      : current,
                  )
                }
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="메모" htmlFor="sub-note">
              <Textarea
                id="sub-note"
                value={draft?.note ?? ""}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, note: event.target.value } : current))
                }
                placeholder="최근 한 달 동안 열지 않음"
              />
            </Field>
            <DialogFooter>
              {draft?.id ? (
                <Button type="button" variant="ghost" className="h-11 px-4 text-destructive" onClick={removeDraft}>
                  목록에서 지우기
                </Button>
              ) : null}
              <Button type="submit" className="h-11 px-4">
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
