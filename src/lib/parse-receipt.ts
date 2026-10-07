import { findService, normalizeName, SERVICES, type Service } from "@/lib/catalog"

export type ParseSuggestion = "subscription" | "once" | "unknown"

export type ParsedLine = {
  raw: string
  name: string
  amount: number | null
  suggestion: ParseSuggestion
  serviceId: string | null
  cancelUrl: string | null
  category: string | null
  reason: string
}

const SUBSCRIPTION_HINTS = ["월정액", "정기결제", "정기", "구독", "멤버십"]

const ONCE_HINTS = [
  "스타벅스",
  "이디야",
  "투썸",
  "메가커피",
  "cu",
  "gs25",
  "세븐일레븐",
  "이마트24",
  "편의점",
  "배달의민족",
  "배민",
  "요기요",
  "쿠팡이츠",
  "택시",
  "카카오택시",
  "지하철",
  "버스",
  "쿠팡",
]

function stripNoise(line: string): string {
  return line
    .replace(/\d{4}[./-]\d{1,2}[./-]\d{1,2}/g, " ")
    .replace(/(^|\s)\d{1,2}[./-]\d{1,2}(?=\s|$)/g, " ")
    .replace(/일시불|할부|승인|체크카드|신용카드/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanName(value: string): string {
  return value
    .replace(/^[\s|\-–—·:]+/, "")
    .replace(/[\s|\-–—·:]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function extractAmount(line: string): { amount: number | null; rest: string } {
  const won = /((?:\d{1,3}(?:,\d{3})+|\d+))\s*원/g
  let wonMatch: RegExpExecArray | null = null
  let current: RegExpExecArray | null
  while ((current = won.exec(line))) wonMatch = current
  if (wonMatch?.[1]) {
    return {
      amount: Number(wonMatch[1].replace(/,/g, "")),
      rest: cleanName(
        line.slice(0, wonMatch.index) + line.slice(wonMatch.index + wonMatch[0].length),
      ),
    }
  }

  const plain = /(\d{1,3}(?:,\d{3})+|\d{3,})/g
  let plainMatch: RegExpExecArray | null = null
  while ((current = plain.exec(line))) plainMatch = current
  if (plainMatch?.[1]) {
    return {
      amount: Number(plainMatch[1].replace(/,/g, "")),
      rest: cleanName(
        line.slice(0, plainMatch.index) +
          line.slice(plainMatch.index + plainMatch[0].length),
      ),
    }
  }

  return { amount: null, rest: cleanName(line) }
}

function matchesHint(name: string, hints: string[]): boolean {
  const normalized = normalizeName(name)
  return hints.some((hint) => normalized.includes(normalizeName(hint)))
}

function parseLine(raw: string, services: Service[]): ParsedLine {
  const stripped = stripNoise(raw)
  const { amount, rest } = extractAmount(stripped)
  const name = rest || "이름 없는 결제"
  const service = findService(name, services)
  const base = {
    raw,
    name: service?.name ?? name,
    amount,
    serviceId: service?.id ?? null,
    cancelUrl: service?.cancelUrl ?? null,
    category: service?.category ?? null,
  }

  if (amount === null) {
    return {
      ...base,
      suggestion: "unknown",
      reason: "금액을 찾지 못했습니다.",
    }
  }

  if (service) {
    return {
      ...base,
      suggestion: "subscription",
      reason: `${service.category} 구독으로 보입니다.`,
    }
  }

  if (matchesHint(name, SUBSCRIPTION_HINTS)) {
    return {
      ...base,
      suggestion: "subscription",
      reason: "정기결제처럼 보이는 문구가 있습니다.",
    }
  }

  if (matchesHint(name, ONCE_HINTS)) {
    return {
      ...base,
      suggestion: "once",
      reason: "한 번 결제로 보여 넣지 않습니다.",
    }
  }

  return {
    ...base,
    suggestion: "unknown",
    reason: "구독인지 한 번 결제인지 확인해 주세요.",
  }
}

export function parseReceipt(
  text: string,
  services: Service[] = SERVICES,
): ParsedLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseLine(line, services))
}
