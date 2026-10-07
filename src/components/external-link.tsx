import { ExternalLinkIcon } from "lucide-react"

export function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
      <span className="sr-only"> (새 창)</span>
    </a>
  )
}
