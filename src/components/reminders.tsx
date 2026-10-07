"use client"

import { useEffect } from "react"
import type { AppState } from "@/lib/types"
import { describeWindows, todayISO } from "@/lib/time"

export function useReminders(state: AppState | null) {
  useEffect(() => {
    if (!state?.notificationsEnabled) return
    if (typeof Notification === "undefined") return
    if (Notification.permission !== "granted") return

    const tick = () => {
      const status = describeWindows(state.windows, new Date())
      if (status.kind !== "now") return
      const key = `deolgi.notified.${todayISO()}.${status.window.id}`
      try {
        if (window.sessionStorage.getItem(key)) return
        window.sessionStorage.setItem(key, "1")
        new Notification("덜기", {
          body: `${status.window.label} 확인 시간입니다. 메신저는 지금만 열면 됩니다.`,
        })
      } catch {
        return
      }
    }

    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [state])
}
