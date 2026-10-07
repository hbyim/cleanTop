"use client"

import { CalendarDays, Clock, CreditCard, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useReminders } from "@/components/reminders"
import { useDeolgi } from "@/components/use-deolgi"
import { cn } from "cn"

const NAV = [
  {
    href: "/",
    label: "이번 주",
    icon: CalendarDays,
    match: (pathname: string) => pathname === "/" || pathname.startsWith("/cut"),
  },
  {
    href: "/subscriptions",
    label: "구독",
    icon: CreditCard,
    match: (pathname: string) => pathname.startsWith("/subscriptions"),
  },
  {
    href: "/people",
    label: "사람",
    icon: Users,
    match: (pathname: string) => pathname.startsWith("/people"),
  },
  {
    href: "/windows",
    label: "확인 시간",
    icon: Clock,
    match: (pathname: string) => pathname.startsWith("/windows"),
  },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const snapshot = useDeolgi()
  useReminders(snapshot.ready && !snapshot.error ? snapshot.state : null)

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        본문으로
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-heading text-2xl tracking-tight">
            덜기
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="주요">
            {NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-28 md:pb-16">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur md:hidden"
        aria-label="주요"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
