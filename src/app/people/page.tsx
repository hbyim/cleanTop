import type { Metadata } from "next"
import { PeoplePanel } from "@/components/people-panel"

export const metadata: Metadata = {
  title: "사람",
}

export default function PeoplePage() {
  return <PeoplePanel />
}
