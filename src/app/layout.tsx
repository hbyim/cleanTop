import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/loading-state";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "덜기",
    template: "%s · 덜기",
  },
  description:
    "이번 주에 줄일 알림, 구독, 약속을 한곳에 모아 두는 주간 정리. 기록은 이 브라우저에만 남습니다.",
  appleWebApp: {
    capable: true,
    title: "덜기",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3efe4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<LoadingState />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
