"use client"

import { useState, useSyncExternalStore } from "react"
import { act } from "@/components/act"
import { Field } from "@/components/field"
import { Ready } from "@/components/ready"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addWindow,
  fillSuggestedWindows,
  removeWindow,
  setNotificationsEnabled,
  updateWindow,
} from "@/lib/store"
import type { AppState } from "@/lib/types"
import { enabledWindows, formatKoreanTime, parseTime, WINDOW_MINUTES } from "@/lib/time"

function subscribePermission() {
  return () => {}
}

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported"
  return Notification.permission
}

function getServerPermissionSnapshot(): "pending" {
  return "pending"
}

export function WindowsPanel() {
  return (
    <Ready>
      {(state) => <Editor state={state} />}
    </Ready>
  )
}

function Editor({ state }: { state: AppState }) {
  const [label, setLabel] = useState("")
  const [time, setTime] = useState("21:00")
  const [error, setError] = useState<string | null>(null)
  const detected = useSyncExternalStore(
    subscribePermission,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  )
  const [override, setOverride] = useState<NotificationPermission | "unsupported" | null>(null)
  const permission = override ?? detected
  const windows = enabledWindows(state.windows)
  const disabled = state.windows.filter((item) => !item.enabled)

  function add() {
    if (!label.trim()) {
      setError("이름을 적어 주세요. 아침, 점심처럼 적어도 됩니다.")
      return
    }
    if (parseTime(time) === null) {
      setError("시간은 00:00 형식으로 골라 주세요.")
      return
    }
    const result = addWindow({ label: label.trim(), time, enabled: true })
    if (!result.ok) {
      setError("확인 시간은 다섯 번이면 충분합니다.")
      return
    }
    setLabel("")
    setTime("21:00")
    setError(null)
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setOverride("unsupported")
      return
    }
    if (Notification.permission === "granted") {
      setOverride("granted")
      setNotificationsEnabled(true)
      return
    }
    const result = await Notification.requestPermission()
    setOverride(result)
    if (result === "granted") setNotificationsEnabled(true)
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight">확인 시간</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          메신저는 이 시간에만 엽니다. 각 시간은 {WINDOW_MINUTES}분입니다. 덜기는 카카오톡이나
          슬랙 알림을 대신 끄지 못하고, 이 화면과 브라우저 알림으로만 알려 줍니다.
        </p>
      </header>

      {state.windows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8">
          <h2 className="font-heading text-2xl tracking-tight">정해 둔 시간이 없습니다.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            아침, 점심, 퇴근 전 세 번이면 대부분의 연락을 놓치지 않습니다.
          </p>
          <Button type="button" className="mt-4 h-11 px-4" onClick={() => fillSuggestedWindows()}>
            아침 · 점심 · 퇴근 전으로 채우기
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {state.windows
            .slice()
            .sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0))
            .map((item) => (
              <li key={item.id} className="grid gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
                  <Field label="이름" htmlFor={`window-label-${item.id}`}>
                    <Input
                      id={`window-label-${item.id}`}
                      value={item.label}
                      onChange={(event) => updateWindow(item.id, { label: event.target.value })}
                    />
                  </Field>
                  <Field label="시간" htmlFor={`window-time-${item.id}`}>
                    <Input
                      id={`window-time-${item.id}`}
                      type="time"
                      value={item.time}
                      onChange={(event) => updateWindow(item.id, { time: event.target.value })}
                    />
                  </Field>
                  <label className="flex items-center gap-2 pt-0 text-sm sm:pt-7">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={item.enabled}
                      onChange={(event) => updateWindow(item.id, { enabled: event.target.checked })}
                    />
                    사용
                  </label>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {item.enabled ? formatKoreanTime(item.time) : "꺼 둠"}
                  </p>
                  <Button type="button" variant="ghost" onClick={() =>
                        act(`${item.label} 확인 시간을 지웠습니다.`, () => removeWindow(item.id))
                      }>
                    삭제
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}

      <section className="grid gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-medium">시간 추가</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <Field label="이름" htmlFor="new-window-label" error={error ?? undefined}>
            <Input
              id="new-window-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="저녁"
              aria-invalid={Boolean(error)}
            />
          </Field>
          <Field label="시간" htmlFor="new-window-time">
            <Input
              id="new-window-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-11 px-4" onClick={add}>
            추가
          </Button>
          {state.windows.length > 0 ? (
            <Button type="button" variant="outline" className="h-11 px-4" onClick={() =>
                act("아침 8:30, 점심 12:40, 퇴근 전 18:10으로 바꿨습니다.", () => fillSuggestedWindows())
              }>
              아침 · 점심 · 퇴근 전으로 바꾸기
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-medium">브라우저 알림</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          이 탭이 열려 있을 때, 확인 시간이 시작되면 한 번 알려 줍니다. 휴대폰이 꺼져 있어도
          울리는 알림은 이후 모바일 앱에서 다룰 수 있습니다.
        </p>
        {permission === "unsupported" ? (
          <p className="text-sm text-muted-foreground">
            이 브라우저는 알림을 지원하지 않습니다. 화면의 확인 시간은 그대로 볼 수 있습니다.
          </p>
        ) : null}
        {permission === "denied" ? (
          <p className="text-sm text-destructive">
            브라우저가 알림을 막아 두었습니다. 주소창의 사이트 설정에서 알림을 허용한 뒤 다시 켤 수
            있습니다.
          </p>
        ) : null}
        {permission === "granted" && state.notificationsEnabled ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm">알림이 켜져 있습니다. 사용 중인 확인 시간 {windows.length}개.</p>
            <Button type="button" variant="outline" onClick={() => setNotificationsEnabled(false)}>
              알림 끄기
            </Button>
          </div>
        ) : null}
        {permission !== "unsupported" && permission !== "denied" && !state.notificationsEnabled ? (
          <Button type="button" className="h-11 w-fit px-4" onClick={() => void enableNotifications()}>
            알림 허용하기
          </Button>
        ) : null}
        {disabled.length > 0 ? (
          <p className="text-xs text-muted-foreground">꺼 둔 시간 {disabled.length}개는 알림에서 빠집니다.</p>
        ) : null}
      </section>

    </div>
  )
}
