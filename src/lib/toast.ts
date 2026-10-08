export type Toast = {
  id: number
  message: string
  undo: (() => boolean) | null
}

const DURATION_MS = 6000

let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeToast(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToast(): Toast | null {
  return current
}

export function getServerToast(): Toast | null {
  return null
}

export function dismissToast() {
  if (timer) clearTimeout(timer)
  timer = null
  current = null
  emit()
}

export function showToast(message: string, undo: (() => boolean) | null = null) {
  if (timer) clearTimeout(timer)
  current = { id: nextId++, message, undo }
  timer = setTimeout(dismissToast, DURATION_MS)
  emit()
}
