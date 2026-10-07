"use client"

import { useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ExternalLink } from "@/components/external-link"
import { controlClass, Field } from "@/components/field"
import { Ready } from "@/components/ready"
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
import { monthlyTotal, sortSubscriptions } from "@/lib/select"
import {
  addSubscription,
  addSubscriptions,
  removeSubscription,
  setSubscriptionStatus,
  setWeeklyCut,
  updateSubscription,
} from "@/lib/store"
import type { AppState, Subscription, SubscriptionStatus } from "@/lib/types"
import { formatWon } from "@/lib/time"

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "유지",
  review: "살펴보기",
  canceling: "해지 예정",
  canceled: "해지함",
}

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
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [receipt, setReceipt] = useState("")
  const [parsed, setParsed] = useState<ParsedLine[] | null>(null)
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const items = sortSubscriptions(state.subscriptions)
  const total = monthlyTotal(state.subscriptions)
  const matched = draft ? findService(draft.name) : undefined

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
    const amount = Number(draft.amount.replace(/,/g, "").trim())
    const billingDay = Number(draft.billingDay)
    if (!draft.name.trim()) nextErrors.name = "이름을 적어 주세요."
    if (!Number.isFinite(amount) || amount < 0) nextErrors.amount = "금액을 숫자로 적어 주세요."
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
    if (draft.id) updateSubscription(draft.id, payload)
    else addSubscription(payload)
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
    if (lines.length === 0) setNotice("붙여 넣은 내용에서 줄을 찾지 못했습니다.")
  }

  function addPicked() {
    if (!parsed) return
    const inputs = parsed.flatMap((line, index) => {
      if (!picked[index] || line.amount === null) return []
      return [
        {
          name: line.name,
          amount: line.amount,
          billingDay: 1,
          status: "review" as const,
          category: line.category,
          cancelUrl: line.cancelUrl,
          note: "",
        },
      ]
    })
    const count = addSubscriptions(inputs)
    setNotice(
      count > 0
        ? `${count}개를 살펴보기로 넣었습니다. 결제일이 보이면 수정에서 바꿔 주세요.`
        : "선택한 항목이 없습니다.",
    )
    if (count > 0) {
      setReceipt("")
      setParsed(null)
      setPicked({})
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
    setNotice(
      result.ok
        ? `${item.name} · 이번 주 끊을 것으로 정해 두었습니다.`
        : "이번 주는 이미 하나를 끝냈습니다. 다음 주에 또 고르면 됩니다.",
    )
  }

  const reviewCount = useMemo(
    () => items.filter((item) => item.status === "review" || item.status === "canceling").length,
    [items],
  )

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight">구독</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          카드 앱의 정기결제만 옮겨 적습니다. 해지 버튼을 누르면 각 서비스 화면으로 이동하고, 실제
          해지는 거기서 합니다.
        </p>
      </header>

      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <p className="text-xs font-medium text-muted-foreground">해지하지 않은 구독</p>
        <p className="mt-1 font-heading text-3xl tracking-tight tabular-nums">한 달 {formatWon(total)}</p>
        <p className="mt-1 text-sm text-muted-foreground">살펴볼 항목 {reviewCount}개</p>
      </section>

      {notice ? (
        <p className="rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">{notice}</p>
      ) : null}

      <Button type="button" className="h-11 w-fit px-4" onClick={openCreate}>
        구독 추가
      </Button>

      <section className="grid gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-medium">카드 내역 붙여넣기</h2>
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
        <Button type="button" variant="outline" className="h-11 w-fit px-4" onClick={inspectReceipt}>
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
                <li key={`${line.raw}-${index}`} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={Boolean(picked[index]) && !disabled}
                    disabled={disabled}
                    aria-label={`${line.name} 목록에 넣기`}
                    onChange={(event) =>
                      setPicked((current) => ({ ...current, [index]: event.target.checked }))
                    }
                  />
                  <div>
                    <p>
                      {line.name}
                      {line.amount !== null ? (
                        <span className="ml-2 tabular-nums text-muted-foreground">
                          {formatWon(line.amount)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {duplicate ? "이미 목록에 있습니다." : line.reason}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
        {parsed ? (
          <Button type="button" className="h-11 w-fit px-4" onClick={addPicked}>
            선택한 항목 넣기
          </Button>
        ) : null}
      </section>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8">
          <h2 className="font-heading text-2xl tracking-tight">적힌 구독이 없습니다.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            자동결제가 없으면 이 목록은 비어 있는 편이 맞습니다.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={item.status === "canceled" ? "text-muted-foreground line-through" : "font-medium"}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    매월 {item.billingDay}일
                    {item.category ? ` · ${item.category}` : ""}
                  </p>
                </div>
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
                <Button type="button" variant="ghost" onClick={() => setDeleteId(item.id)}>
                  삭제
                </Button>
              </div>
              {!item.cancelUrl ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  해지 페이지를 찾지 못했습니다. 그 서비스의 구독 관리에서 직접 해지하면 됩니다.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

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
              />
            </Field>
            {matched ? (
              <p className="text-xs text-muted-foreground">
                {matched.name} 해지 페이지를 찾아 두었습니다.
              </p>
            ) : null}
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
                placeholder="17000"
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
                placeholder="3"
              />
            </Field>
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
              <Button type="submit" className="h-11 px-4">
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="이 구독을 목록에서 지울까요?"
        description="실제 해지와는 별개입니다. 서비스에는 그대로 남아 있습니다."
        confirmLabel="목록에서 지우기"
        onConfirm={() => deleteId && removeSubscription(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </div>
  )
}
