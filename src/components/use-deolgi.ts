"use client"

import { useEffect, useSyncExternalStore } from "react"
import {
  getServerSnapshot,
  getSnapshot,
  hydrateFromStorage,
  subscribe,
  type Snapshot,
} from "@/lib/store"

export function useDeolgi(): Snapshot {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useEffect(() => {
    hydrateFromStorage()
  }, [])
  return snapshot
}
