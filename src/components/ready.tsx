"use client"

import { LoadingState, StorageError } from "@/components/loading-state"
import { useDeolgi } from "@/components/use-deolgi"
import type { AppState } from "@/lib/types"

export function Ready({
  children,
}: {
  children: (state: AppState) => React.ReactNode
}) {
  const snapshot = useDeolgi()
  if (!snapshot.ready) return <LoadingState />
  if (snapshot.error) return <StorageError message={snapshot.error} />
  return children(snapshot.state)
}
