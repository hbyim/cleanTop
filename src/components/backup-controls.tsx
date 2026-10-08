"use client"

import { useRef } from "react"
import { act } from "@/components/act"
import { exportBackup, importBackup, parseBackup } from "@/lib/store"
import { showToast } from "@/lib/toast"
import { todayISO } from "@/lib/time"

const linkClass = "text-muted-foreground underline-offset-4 hover:underline disabled:opacity-40"

export function BackupControls({ blank }: { blank: boolean }) {
  const input = useRef<HTMLInputElement>(null)

  function download() {
    const text = exportBackup()
    if (!text) return
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `deolgi-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
    showToast("기록을 파일로 내려받았습니다. 다른 기기에서 가져오기로 열 수 있습니다.")
  }

  async function upload(file: File) {
    const text = await file.text()
    if (!parseBackup(text)) {
      showToast("덜기 기록 파일이 아니거나 읽을 수 없는 파일입니다.")
      return
    }
    act("파일의 기록으로 바꿨습니다.", () => {
      importBackup(text)
    })
  }

  return (
    <>
      <button type="button" className={linkClass} onClick={download} disabled={blank}>
        기록 내보내기
      </button>
      <button type="button" className={linkClass} onClick={() => input.current?.click()}>
        기록 가져오기
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void upload(file)
        }}
      />
    </>
  )
}
