import Link from "next/link"

export default function NotFound() {
  return (
    <div className="grid max-w-lg gap-4 py-10">
      <h1 className="font-heading text-3xl tracking-tight">없는 화면입니다.</h1>
      <p className="text-sm leading-6 text-muted-foreground">이번 주 화면으로 돌아가면 됩니다.</p>
      <Link
        href="/"
        className="inline-flex h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        이번 주로
      </Link>
    </div>
  )
}
