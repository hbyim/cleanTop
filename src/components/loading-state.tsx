"use client"

import { Button } from "@/components/ui/button"
import { clearStorage } from "@/lib/store"

export function LoadingState() {
  return (
    <div className="grid gap-3 py-8" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">기록을 불러오는 중</p>
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

export function StorageError({ message }: { message: string }) {
  return (
    <div className="mx-auto grid max-w-lg gap-4 py-10">
      <h1 className="font-heading text-3xl tracking-tight">저장된 기록을 읽지 못했습니다.</h1>
      <p className="text-sm leading-6 text-muted-foreground">{message}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        이 브라우저의 덜기 기록을 지우면 빈 화면에서 다시 시작할 수 있습니다.
      </p>
      <Button className="h-11 w-fit px-4" onClick={() => clearStorage()}>
        기록 지우기
      </Button>
    </div>
  )
}
