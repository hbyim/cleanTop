import type { Metadata } from "next"
import { CutPanel } from "@/components/cut-panel"

export const metadata: Metadata = {
  title: "이번 주 끊을 것",
}

export default function CutPage() {
  return <CutPanel />
}
