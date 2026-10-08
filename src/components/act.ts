import { withUndo } from "@/lib/store"
import { showToast } from "@/lib/toast"

// 기록을 바꾸고, 되돌리기 버튼이 있는 알림을 띄웁니다.
export function act(message: string, run: () => void) {
  showToast(message, withUndo(run))
}
