import { describe, expect, it } from "vitest"
import { parseReceipt } from "@/lib/parse-receipt"
import { describeWindows } from "@/lib/time"
import type { CheckWindow } from "@/lib/types"

const windows: CheckWindow[] = [
  { id: "morning", label: "아침", time: "08:30", enabled: true },
  { id: "lunch", label: "점심", time: "12:40", enabled: true },
  { id: "evening", label: "퇴근 전", time: "18:10", enabled: false },
]

describe("parseReceipt", () => {
  it("구독 서비스와 금액을 구분한다", () => {
    const [line] = parseReceipt("2026-10-07 넷플릭스 17,000원")
    expect(line?.suggestion).toBe("subscription")
    expect(line?.name).toBe("넷플릭스")
    expect(line?.amount).toBe(17000)
    expect(line?.cancelUrl).toContain("netflix.com")
  })

  it("쿠팡 와우는 구독으로, 쿠팡 일반 결제는 한 번 결제로 본다", () => {
    const lines = parseReceipt("쿠팡 와우 7,890\n쿠팡 23,400")
    expect(lines[0]?.suggestion).toBe("subscription")
    expect(lines[0]?.name).toBe("쿠팡 와우")
    expect(lines[1]?.suggestion).toBe("once")
  })

  it("유튜브 프리미엄과 유튜브 뮤직을 서로 다르게 본다", () => {
    const lines = parseReceipt("유튜브 프리미엄 14900\n유튜브 뮤직 10900")
    expect(lines[0]?.name).toBe("유튜브 프리미엄")
    expect(lines[1]?.name).toBe("유튜브 뮤직")
  })

  it("날짜가 앞에 붙은 멜론 결제를 구독으로 본다", () => {
    const [line] = parseReceipt("10/07 멜론 10,900")
    expect(line?.suggestion).toBe("subscription")
    expect(line?.amount).toBe(10900)
    expect(line?.name).toBe("멜론")
  })

  it("카페 결제는 넣지 않는다", () => {
    const [line] = parseReceipt("스타벅스 6,500")
    expect(line?.suggestion).toBe("once")
    expect(line?.amount).toBe(6500)
  })

  it("금액이 없으면 이유를 남긴다", () => {
    const [line] = parseReceipt("넷플릭스")
    expect(line?.suggestion).toBe("unknown")
    expect(line?.amount).toBeNull()
    expect(line?.reason).toContain("금액")
  })
})

describe("describeWindows", () => {
  it("확인 시간 20분 안이면 지금이라고 본다", () => {
    const status = describeWindows(windows, new Date(2026, 9, 7, 8, 40))
    expect(status.kind).toBe("now")
    if (status.kind === "now") expect(status.window.label).toBe("아침")
  })

  it("다음 확인 시간까지 남은 분을 계산한다", () => {
    const status = describeWindows(windows, new Date(2026, 9, 7, 9, 0))
    expect(status.kind).toBe("later")
    if (status.kind === "later") {
      expect(status.window.label).toBe("점심")
      expect(status.tomorrow).toBe(false)
      expect(status.minutesUntil).toBe(3 * 60 + 40)
    }
  })

  it("꺼 둔 시간은 건너뛴다", () => {
    const status = describeWindows(windows, new Date(2026, 9, 7, 17, 0))
    expect(status.kind).toBe("later")
    if (status.kind === "later") {
      expect(status.window.label).toBe("아침")
      expect(status.tomorrow).toBe(true)
    }
  })
})
