import type { Metadata } from "next"
import { WindowsPanel } from "@/components/windows-panel"

export const metadata: Metadata = {
  title: "확인 시간",
}

export default function WindowsPage() {
  return <WindowsPanel />
}
