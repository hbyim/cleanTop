import type { Metadata } from "next"
import { WeekBoard } from "@/components/week-board"

export const metadata: Metadata = {
  title: "이번 주",
}

export default function HomePage() {
  return <WeekBoard />
}
