"use client"

import { useState } from "react"
import { act } from "@/components/act"
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
import { sortPeople } from "@/lib/select"
import { addPerson, markPersonMet, removePerson, snoozePerson, updatePerson } from "@/lib/store"
import type { AppState, Person } from "@/lib/types"
import { formatCadence, formatMonthDay, formatRelativeDay, todayISO } from "@/lib/time"
import { useNow } from "@/components/use-now"
import { cn } from "cn"

type Draft = {
  id: string | null
  name: string
  relation: string
  cadence: string
  customCadence: string
  nextAt: string
  note: string
}

const EMPTY_DRAFT: Draft = {
  id: null,
  name: "",
  relation: "",
  cadence: "14",
  customCadence: "",
  nextAt: "",
  note: "",
}

export function PeoplePanel() {
  return (
    <Ready>
      {(state) => <Editor state={state} />}
    </Ready>
  )
}

function Editor({ state }: { state: AppState }) {
  const now = useNow()
  const today = now ? todayISO(now) : null
  const people = sortPeople(state.people)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openCreate() {
    setErrors({})
    setDraft(EMPTY_DRAFT)
  }

  function openEdit(person: Person) {
    const preset = ["7", "14", "30"].includes(String(person.cadenceDays))
    setErrors({})
    setDraft({
      id: person.id,
      name: person.name,
      relation: person.relation,
      cadence: preset ? String(person.cadenceDays) : "custom",
      customCadence: preset ? "" : String(person.cadenceDays),
      nextAt: person.nextAt,
      note: person.note,
    })
  }

  function saveDraft() {
    if (!draft) return
    const nextErrors: Record<string, string> = {}
    const cadenceValue = draft.cadence === "custom" ? Number(draft.customCadence) : Number(draft.cadence)
    if (!draft.name.trim()) nextErrors.name = "이름을 적어 주세요."
    if (!draft.relation.trim()) nextErrors.relation = "관계를 적어 주세요."
    if (!Number.isInteger(cadenceValue) || cadenceValue < 1 || cadenceValue > 365) {
      nextErrors.cadence = "간격은 1일부터 365일 사이입니다."
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.nextAt)) nextErrors.nextAt = "다음 만남 날짜를 골라 주세요."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      name: draft.name.trim(),
      relation: draft.relation.trim(),
      cadenceDays: cadenceValue,
      nextAt: draft.nextAt,
      note: draft.note.trim(),
    }
    if (draft.id) {
      const id = draft.id
      act(`${payload.name} · 저장했습니다.`, () => updatePerson(id, payload))
    } else {
      act(`${payload.name} · 추가했습니다.`, () => addPerson({ ...payload, lastMetAt: null }))
    }
    setDraft(null)
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight">사람</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          단체 방의 안부 대신, 실제로 손을 빌릴 수 있는 사람만 적습니다. 만난 날을 남기면 다음
          날짜가 간격만큼 밀립니다.
        </p>
      </header>
      <Button type="button" className="h-11 w-fit px-4" onClick={openCreate}>
        사람 추가
      </Button>
      {people.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8">
          <h2 className="font-heading text-2xl tracking-tight">남겨 둘 사람이 없습니다.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            아플 때 연락할 사람부터 한 명 적어도 됩니다.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {people.map((person) => {
            const overdue = today ? person.nextAt < today : false
            return (
              <li
                key={person.id}
                className={cn(
                  "rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10",
                  overdue && "ring-review-foreground/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.relation} · {formatCadence(person.cadenceDays)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm", overdue && "font-medium text-review-foreground")}>
                      {today ? formatRelativeDay(person.nextAt, today) : formatMonthDay(person.nextAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatMonthDay(person.nextAt)}</p>
                  </div>
                </div>
                {person.note ? <p className="mt-2 text-sm text-muted-foreground">{person.note}</p> : null}
                {person.lastMetAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    지난 만남 {formatMonthDay(person.lastMetAt)}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" className="h-10 px-3" onClick={() =>
                      act(`${person.name} · 오늘 만남을 남겼습니다.`, () => markPersonMet(person.id))
                    }>
                    만났어요
                  </Button>
                  <Button type="button" variant="outline" onClick={() =>
                      act(`${person.name} · 일주일 미뤘습니다.`, () => snoozePerson(person.id))
                    }>
                    일주일 미루기
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => openEdit(person)}>
                    수정
                  </Button>
                  <Button type="button" variant="ghost" onClick={() =>
                      act(`${person.name} · 목록에서 지웠습니다.`, () => removePerson(person.id))
                    }>
                    삭제
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "사람 수정" : "사람 추가"}</DialogTitle>
            <DialogDescription>자주 연락하는 수가 아니라, 만나거나 통화할 간격을 적습니다.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              saveDraft()
            }}
          >
            <Field label="이름" htmlFor="person-name" error={errors.name}>
              <Input
                id="person-name"
                value={draft?.name ?? ""}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, name: event.target.value } : current))
                }
                aria-invalid={Boolean(errors.name)}
              />
            </Field>
            <Field label="관계" htmlFor="person-relation" error={errors.relation}>
              <Input
                id="person-relation"
                list="relations"
                value={draft?.relation ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, relation: event.target.value } : current,
                  )
                }
                aria-invalid={Boolean(errors.relation)}
                placeholder="가족, 친구, 동료"
              />
              <datalist id="relations">
                <option value="가족" />
                <option value="친구" />
                <option value="동료" />
                <option value="이웃" />
              </datalist>
            </Field>
            <Field
              label="간격"
              htmlFor="person-cadence"
              error={draft?.cadence === "custom" ? undefined : errors.cadence}
            >
              <select
                id="person-cadence"
                className={controlClass}
                value={draft?.cadence ?? "14"}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, cadence: event.target.value } : current,
                  )
                }
              >
                <option value="7">일주일에 한 번</option>
                <option value="14">2주에 한 번</option>
                <option value="30">한 달에 한 번</option>
                <option value="custom">직접 입력</option>
              </select>
            </Field>
            {draft?.cadence === "custom" ? (
              <Field label="며칠마다" htmlFor="person-custom-cadence" error={errors.cadence}>
                <Input
                  id="person-custom-cadence"
                  inputMode="numeric"
                  value={draft.customCadence}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, customCadence: event.target.value } : current,
                    )
                  }
                />
              </Field>
            ) : null}
            <Field label="다음 만남" htmlFor="person-next" error={errors.nextAt}>
              <Input
                id="person-next"
                type="date"
                value={draft?.nextAt ?? ""}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, nextAt: event.target.value } : current))
                }
                aria-invalid={Boolean(errors.nextAt)}
              />
            </Field>
            <Field label="메모" htmlFor="person-note">
              <Textarea
                id="person-note"
                value={draft?.note ?? ""}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, note: event.target.value } : current))
                }
                placeholder="저녁에 전화"
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
    </div>
  )
}
