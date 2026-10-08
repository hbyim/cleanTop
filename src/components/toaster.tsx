"use client"

import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { dismissToast, getServerToast, getToast, showToast, subscribeToast } from "@/lib/toast"

export function Toaster() {
  const toast = useSyncExternalStore(subscribeToast, getToast, getServerToast)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6"
      aria-live="polite"
      role="status"
    >
      {toast ? (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg"
        >
          <p className="leading-5">{toast.message}</p>
          <div className="flex shrink-0 items-center gap-1">
            {toast.undo ? (
              <Button
                type="button"
                variant="ghost"
                className="text-background hover:bg-background/15 hover:text-background"
                onClick={() => {
                  const undone = toast.undo?.() ?? false
                  if (undone) showToast("되돌렸습니다.")
                  else showToast("그 사이 다른 변경이 있어 되돌리지 못했습니다.")
                }}
              >
                되돌리기
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="text-background/70 hover:bg-background/15 hover:text-background"
              aria-label="알림 닫기"
              onClick={() => dismissToast()}
            >
              닫기
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
