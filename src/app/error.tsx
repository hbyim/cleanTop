"use client"

import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid max-w-lg gap-4 py-10">
      <h1 className="font-heading text-3xl tracking-tight">화면을 불러오지 못했습니다.</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        기록은 이 브라우저에 그대로 있습니다. 다시 열면 이어서 볼 수 있습니다.
      </p>
      <Button className="h-11 w-fit px-4" onClick={() => reset()}>
        다시 시도
      </Button>
    </div>
  )
}
