import { describe, expect, it } from "vitest"
import { parseBackup } from "@/lib/store"
import { EMPTY_STATE } from "@/lib/types"

describe("parseBackup", () => {
  const state = {
    ...EMPTY_STATE,
    windows: [{ id: "w", label: "아침", time: "08:30", enabled: true }],
  }

  it("내보낸 파일을 읽습니다", () => {
    const text = JSON.stringify({ app: "deolgi", version: 1, exportedAt: "x", state })
    expect(parseBackup(text)?.windows).toHaveLength(1)
  })

  it("저장소 원본 형식도 읽습니다", () => {
    expect(parseBackup(JSON.stringify(state))?.windows[0].label).toBe("아침")
  })

  it("다른 파일은 거릅니다", () => {
    expect(parseBackup("not json")).toBeNull()
    expect(parseBackup(JSON.stringify({ hello: 1 }))).toBeNull()
  })
})
