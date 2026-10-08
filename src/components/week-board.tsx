"use client"

import Link from "next/link"
import { BackupControls } from "@/components/backup-controls"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Ready } from "@/components/ready"
import { buttonVariants } from "@/components/ui/button"
import { useNow } from "@/components/use-now"
import { clearStorage, loadExample } from "@/lib/store"
import {
  currentCut,
  isBlankState,
  monthlyTotal,
  sortPeople,
  subscriptionsToReview,
  upcomingBillings,
} from "@/lib/select"
import type { AppState } from "@/lib/types"
import {
  describeWindows,
  enabledWindows,
  formatCadence,
  formatDuration,
  formatFullDate,
  formatKoreanTime,
  formatRelativeDay,
  formatWon,
  todayISO,
} from "@/lib/time"
import { useState } from "react"
import { cn } from "cn"

export function WeekBoard() {
  return (
    <Ready>
      {(state) => <Board state={state} />}
    </Ready>
  )
}

function Board({ state }: { state: AppState }) {
  const now = useNow()
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmExample, setConfirmExample] = useState(false)
  const blank = isBlankState(state)

  return (
    <div className="grid gap-8">
      {blank ? <Welcome now={now} /> : <Overview state={state} now={now} />}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => (blank ? loadExample() : setConfirmExample(true))}
        >
          예시로 둘러보기
        </button>
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-40"
          onClick={() => setConfirmClear(true)}
          disabled={blank}
        >
          이 브라우저의 기록 지우기
        </button>
        <BackupControls blank={blank} />
      </div>
      <ConfirmDialog
        open={confirmExample}
        title="예시를 불러올까요?"
        description="지금 적어 둔 확인 시간, 구독, 사람, 이번 주 기록이 예시로 바뀝니다."
        confirmLabel="예시로 바꾸기"
        onConfirm={() => loadExample()}
        onOpenChange={setConfirmExample}
      />
      <ConfirmDialog
        open={confirmClear}
        title="기록을 지울까요?"
        description="이 브라우저에만 저장된 덜기 기록이 사라집니다. 구독 해지나 알림 설정은 바뀌지 않습니다."
        confirmLabel="기록 지우기"
        onConfirm={() => clearStorage()}
        onOpenChange={setConfirmClear}
      />
    </div>
  )
}

function Welcome({ now }: { now: Date | null }) {
  return (
    <section className="grid gap-6 py-4">
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {now ? formatFullDate(now) : "오늘 날짜를 확인하는 중"}
        </p>
        <h1 className="max-w-xl font-heading text-4xl leading-tight tracking-tight">
          이번 주에 응답할 일을 줄입니다.
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          알림, 자동결제, 형식적인 연락이 늘면 시간은 더 잘게 쪼개집니다. 덜기는 그 셋을 한 주
          단위로 적고, 직접 끌 화면까지 안내합니다. 카카오톡을 대신 끄거나 구독을 대신 해지하지는
          않습니다.
        </p>
      </div>
      <ul className="grid gap-2 text-sm leading-6">
        <li>확인 시간을 정해 메신저를 그 시간에만 엽니다.</li>
        <li>구독 금액과 해지 페이지를 한 목록으로 둡니다.</li>
        <li>도움을 주고받을 사람의 다음 만남을 적습니다.</li>
        <li>이번 주에 끊을 것은 하나만 고릅니다.</li>
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/windows" className={buttonVariants({ className: "h-11 px-4" })}>
          확인 시간부터
        </Link>
        <Link
          href="/subscriptions"
          className={buttonVariants({ variant: "outline", className: "h-11 px-4" })}
        >
          구독 적기
        </Link>
        <Link
          href="/people"
          className={buttonVariants({ variant: "outline", className: "h-11 px-4" })}
        >
          사람 적기
        </Link>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        기록은 이 브라우저에만 남습니다. 계정은 만들지 않습니다.
      </p>
    </section>
  )
}

function Overview({ state, now }: { state: AppState; now: Date | null }) {
  const today = now ? todayISO(now) : null
  const status = now ? describeWindows(state.windows, now) : null
  const cut = now ? currentCut(state.cuts, now) : null
  const review = subscriptionsToReview(state.subscriptions)
  const people = sortPeople(state.people).slice(0, 3)
  const total = monthlyTotal(state.subscriptions)
  const upcoming = today ? upcomingBillings(state.subscriptions, today, 7) : []

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {now ? formatFullDate(now) : "오늘 날짜를 확인하는 중"}
        </p>
        {status?.kind === "now" ? (
          <div className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground">
            <p className="text-sm">지금이 확인 시간입니다</p>
            <h1 className="mt-1 font-heading text-3xl tracking-tight">
              {status.window.label} · {formatKoreanTime(status.window.time)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
              20분 동안만 메신저를 엽니다. {status.minutesLeft}분 남았습니다.
            </p>
          </div>
        ) : null}
        {status?.kind === "later" ? (
          <div>
            <h1 className="font-heading text-3xl tracking-tight">
              다음 확인은 {formatKoreanTime(status.window.time)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {status.window.label}
              {status.tomorrow ? " · 내일" : ""} · {formatDuration(status.minutesUntil)}. 그
              전까지 알림은 쌓아 둡니다.
            </p>
          </div>
        ) : null}
        {status?.kind === "none" ? (
          <div>
            <h1 className="font-heading text-3xl tracking-tight">확인 시간이 없습니다</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              하루 두세 번만 메신저를 보려면 시간을 정해 두세요.
            </p>
            <Link href="/windows" className={buttonVariants({ className: "mt-4 h-11 px-4" })}>
              확인 시간 정하기
            </Link>
          </div>
        ) : null}
        {status === null ? <div className="h-20 animate-pulse rounded-2xl bg-muted" /> : null}
        {status && status.kind !== "none" ? <WindowStrip state={state} now={now} /> : null}
      </section>

      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xs font-medium text-muted-foreground">이번 주 끊을 것</h2>
          <Link href="/cut" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {cut ? "다시 보기" : "고르기"}
          </Link>
        </div>
        {cut?.done ? (
          <p className="mt-3 text-base leading-7">이번 주에 끝낸 일 · {cut.title}</p>
        ) : null}
        {cut && !cut.done ? (
          <div className="mt-3 grid gap-3">
            <p className="font-heading text-2xl tracking-tight">{cut.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{cut.steps[0]}</p>
            <Link href="/cut" className={buttonVariants({ className: "h-11 w-fit px-4" })}>
              순서 보고 완료하기
            </Link>
          </div>
        ) : null}
        {!cut ? (
          <div className="mt-3 grid gap-3">
            <p className="text-sm leading-6">하나만 고르면 됩니다.</p>
            <Link href="/cut" className={buttonVariants({ className: "h-11 w-fit px-4" })}>
              이번 주 것 고르기
            </Link>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-medium text-muted-foreground">구독</h2>
            <Link
              href="/subscriptions"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              목록
            </Link>
          </div>
          <p className="mt-3 font-heading text-2xl tracking-tight tabular-nums">
            한 달 {formatWon(total)}
          </p>
          {upcoming.length > 0 && today ? (
            <div className="mt-3 rounded-xl bg-review px-3 py-2">
              <h3 className="text-xs font-medium text-review-foreground">7일 안에 결제</h3>
              <ul className="mt-1 grid gap-1">
                {upcoming.slice(0, 3).map(({ subscription, date }) => (
                  <li key={subscription.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      {subscription.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatRelativeDay(date, today)}
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatWon(subscription.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {state.subscriptions.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              카드 앱의 정기결제만 옮겨 적으면 됩니다.
            </p>
          ) : review.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              살펴볼 구독은 없습니다. 해지한 항목은 합계에서 빠집니다.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              <li className="text-xs font-medium text-muted-foreground">살펴볼 구독</li>
              {review.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span className="tabular-nums text-muted-foreground">{formatWon(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-medium text-muted-foreground">사람</h2>
            <Link href="/people" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              목록
            </Link>
          </div>
          {people.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              단체 방 대신, 실제로 연락할 사람부터 한 명 적습니다.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {people.map((person) => {
                const relative = today ? formatRelativeDay(person.nextAt, today) : ""
                const overdue = today ? person.nextAt < today : false
                return (
                  <li key={person.id} className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.relation} · {formatCadence(person.cadenceDays)}
                      </p>
                    </div>
                    <p className={cn("text-sm", overdue && "text-review-foreground")}>{relative}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function WindowStrip({ state, now }: { state: AppState; now: Date | null }) {
  const windows = enabledWindows(state.windows)
  const status = now ? describeWindows(state.windows, now) : null
  return (
    <ol className="grid grid-cols-3 gap-2">
      {windows.slice(0, 3).map((window) => {
        const active = status !== null && status.kind !== "none" && status.window.id === window.id
        return (
          <li
            key={window.id}
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <p className="text-xs">{window.label}</p>
            <p className="tabular-nums">{formatKoreanTime(window.time)}</p>
          </li>
        )
      })}
    </ol>
  )
}
