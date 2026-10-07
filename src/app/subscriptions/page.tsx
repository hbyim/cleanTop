import type { Metadata } from "next"
import { SubscriptionPanel } from "@/components/subscription-panel"

export const metadata: Metadata = {
  title: "구독",
}

export default function SubscriptionsPage() {
  return <SubscriptionPanel />
}
