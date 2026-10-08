"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink } from "@/components/external-link"
import { Field } from "@/components/field"
import { Ready } from "@/components/ready"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CUT_GUIDES, type CutKind } from "@/lib/catalog"
import { currentCut, pastCuts } from "@/lib/select"
import { markCutDone, setSubscriptionStatus, setWeeklyCut, undoCutDone } from "@/lib/store"
import type { AppState } from "@/lib/types"
import { formatMonthDay } from "@/lib/time"
import { showToast } from "@/lib/toast"
import { useNow } from "@/components/use-now"
import { cn } from "cn"

const KINDS: CutKind[] = ["채널", "구독", "계정"]

export function CutPanel() {
  return (
    <Ready>
      {(state) => <Editor state={state} />}
    </Ready>
  )
}

function Editor({ state }: { state: AppState }) {
  const now = useNow()
  const cut = now ? currentCut(state.cuts, now) : null
  const history = now ? pastCuts(state.cuts, now) : []
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const linked = state.subscriptions.find((item) => item.id === cut?.subscriptionId) ?? null

  function choose(input: Parameters<typeof setWeeklyCut>[0]) {
    const result = setWeeklyCut(input)
    showToast(
      result.ok
        ? `${input.title} · 이번 주 끊을 것으로 정해 두었습니다.`
        : "이번 주는 이미 하나를 끝냈습니다. 다음 주에 또 고르면 됩니다.",
    )
    if (!result.ok) setError(null)
    if (result.ok) window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function chooseCustom() {
    if (!title.trim()) {
      setError("끊을 일을 한 줄로 적어 주세요.")
      return
    }
    setError(null)
    choose({
      catalogId: null,
      subscriptionId: null,
      title: title.trim(),
      steps: [
        "적은 곳에서 직접 끄거나 해지합니다.",
        "끝나면 여기로 돌아와 완료로 남깁니다.",
      ],
      href: null,
      hrefLabel: null,
    })
    setTitle("")
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight">이번 주 끊을 것</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          하나만 고릅니다. 순서는 안내이고, 끄기와 해지는 각 앱에서 직접 합니다.
        </p>
      </header>

      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        {!cut ? (
          <p className="text-sm leading-6">아직 고르지 않았습니다. 아래에서 하나를 고르면 됩니다.</p>
        ) : (
          <div className="grid gap-4">
            <p className="text-xs font-medium text-muted-foreground">
              {cut.done ? "이번 주에 끝낸 일" : "이번 주"}
            </p>
            <h2 className="font-heading text-2xl tracking-tight">{cut.title}</h2>
            <ol className="grid gap-3">
              {cut.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {cut.href ? <ExternalLink href={cut.href}>{cut.hrefLabel ?? "해당 페이지 열기"}</ExternalLink> : null}
            <p className="text-xs leading-5 text-muted-foreground">
              앱이 대신 끄지는 않습니다. 끝난 뒤 완료로 남기면 이번 주 기록이 됩니다.
            </p>
            {cut.done ? (
              <Button type="button" variant="outline" className="h-11 w-fit px-4" onClick={() => undoCutDone()}>
                완료 취소
              </Button>
            ) : (
              <Button type="button" className="h-11 w-fit px-4" onClick={() => {
                  markCutDone()
                  showToast("이번 주 정리를 끝냈습니다. 수고했어요.")
                }}>
                끝냈어요
              </Button>
            )}
            {linked && linked.status !== "canceled" ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-fit px-4"
                onClick={() => setSubscriptionStatus(linked.id, "canceled")}
              >
                구독 목록도 해지함으로
              </Button>
            ) : null}
            {linked ? (
              <Link href="/subscriptions" className="text-sm text-primary underline-offset-4 hover:underline">
                구독 목록에서 보기
              </Link>
            ) : null}
          </div>
        )}
      </section>

      {KINDS.map((kind) => (
        <section key={kind} className="grid gap-3">
          <h2 className="text-xs font-medium text-muted-foreground">{kind}</h2>
          <ul className="grid gap-3">
            {CUT_GUIDES.filter((guide) => guide.kind === kind).map((guide) => {
              const selected = cut?.catalogId === guide.id
              return (
                <li
                  key={guide.id}
                  className={cn(
                    "rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10",
                    selected && "ring-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{guide.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
                    </div>
                    {selected ? <span className="text-xs text-primary">이번 주</span> : null}
                  </div>
                  <Button
                    type="button"
                    variant={selected ? "secondary" : "outline"}
                    className="mt-3 h-10"
                    onClick={() =>
                      choose({
                        catalogId: guide.id,
                        subscriptionId: null,
                        title: guide.title,
                        steps: guide.steps,
                        href: guide.href,
                        hrefLabel: guide.hrefLabel,
                      })
                    }
                  >
                    이번 주로 고르기
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <section className="grid gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-medium">직접 적기</h2>
        <Field label="한 줄" htmlFor="custom-cut" error={error ?? undefined}>
          <Input
            id="custom-cut"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="회사 단톡은 퇴근 뒤에만 보기"
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Button type="button" className="h-11 w-fit px-4" onClick={chooseCustom}>
          이번 주로 정하기
        </Button>
      </section>

      {history.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">지난 정리</h2>
          <ul className="grid gap-2 text-sm">
            {history.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3">
                <span>{item.title}</span>
                <span className="text-muted-foreground">{formatMonthDay(item.weekOf)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
