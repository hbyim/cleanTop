"use client"

import { useEffect, useState } from "react"

export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const id = window.setInterval(update, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return now
}
