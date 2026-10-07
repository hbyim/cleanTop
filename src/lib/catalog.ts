export type ServiceCategory =
  | "영상"
  | "음악"
  | "쇼핑"
  | "클라우드"
  | "AI"
  | "기타"

export type Service = {
  id: string
  name: string
  aliases: string[]
  category: ServiceCategory
  cancelUrl: string
}

export const SERVICES: Service[] = [
  {
    id: "netflix",
    name: "넷플릭스",
    aliases: ["netflix"],
    category: "영상",
    cancelUrl: "https://www.netflix.com/cancelplan",
  },
  {
    id: "youtube-premium",
    name: "유튜브 프리미엄",
    aliases: ["유튜브프리미엄", "youtube premium", "youtubepremium"],
    category: "영상",
    cancelUrl: "https://www.youtube.com/paid_memberships",
  },
  {
    id: "tving",
    name: "티빙",
    aliases: ["tving"],
    category: "영상",
    cancelUrl: "https://www.tving.com/account/membership",
  },
  {
    id: "wavve",
    name: "웨이브",
    aliases: ["wavve"],
    category: "영상",
    cancelUrl: "https://www.wavve.com/my",
  },
  {
    id: "disney",
    name: "디즈니+",
    aliases: ["디즈니플러스", "disney+", "disneyplus", "disney plus"],
    category: "영상",
    cancelUrl: "https://www.disneyplus.com/account/subscription",
  },
  {
    id: "coupang-play",
    name: "쿠팡플레이",
    aliases: ["coupang play", "coupangplay"],
    category: "영상",
    cancelUrl: "https://www.coupangplay.com/",
  },
  {
    id: "melon",
    name: "멜론",
    aliases: ["melon"],
    category: "음악",
    cancelUrl: "https://www.melon.com/mymusic/myinfo/informMyInfo.htm",
  },
  {
    id: "spotify",
    name: "스포티파이",
    aliases: ["spotify"],
    category: "음악",
    cancelUrl: "https://www.spotify.com/account/subscription/",
  },
  {
    id: "apple-music",
    name: "애플 뮤직",
    aliases: ["apple music", "applemusic"],
    category: "음악",
    cancelUrl: "https://apps.apple.com/account/subscriptions",
  },
  {
    id: "youtube-music",
    name: "유튜브 뮤직",
    aliases: ["유튜브뮤직", "youtube music", "youtubemusic"],
    category: "음악",
    cancelUrl: "https://www.youtube.com/paid_memberships",
  },
  {
    id: "coupang-wow",
    name: "쿠팡 와우",
    aliases: ["쿠팡와우", "로켓와우", "와우멤버십", "coupang wow", "coupangwow"],
    category: "쇼핑",
    cancelUrl: "https://mc.coupang.com/ssr/desktop/membership/home",
  },
  {
    id: "naver-plus",
    name: "네이버 플러스",
    aliases: ["네이버플러스", "naver plus", "naverplus"],
    category: "쇼핑",
    cancelUrl: "https://nid.naver.com/membership/my",
  },
  {
    id: "baemin-club",
    name: "배민클럽",
    aliases: ["배민 클럽"],
    category: "쇼핑",
    cancelUrl: "https://www.baemin.com/",
  },
  {
    id: "icloud",
    name: "iCloud",
    aliases: ["아이클라우드", "icloud+", "icloud plus"],
    category: "클라우드",
    cancelUrl: "https://apps.apple.com/account/subscriptions",
  },
  {
    id: "google-one",
    name: "구글 원",
    aliases: ["google one", "googleone"],
    category: "클라우드",
    cancelUrl: "https://one.google.com/settings",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    aliases: ["chatgpt plus", "chatgptplus", "챗지피티", "openai"],
    category: "AI",
    cancelUrl: "https://chatgpt.com/#settings/Subscription",
  },
  {
    id: "claude",
    name: "Claude",
    aliases: ["클로드", "anthropic"],
    category: "AI",
    cancelUrl: "https://claude.ai/settings/billing",
  },
]

export type CutKind = "채널" | "구독" | "계정"

export type CutGuide = {
  id: string
  kind: CutKind
  title: string
  summary: string
  steps: string[]
  href: string | null
  hrefLabel: string | null
}

export const CUT_GUIDES: CutGuide[] = [
  {
    id: "kakao-mute",
    kind: "채널",
    title: "카카오톡 단톡방 알림 끄기",
    summary: "가족이나 바로 답해야 하는 방만 남깁니다.",
    steps: [
      "카카오톡에서 알림이 잦은 단톡방을 엽니다.",
      "오른쪽 위 메뉴에서 알림 끄기를 켭니다.",
      "가족, 일의 필수 방, 바로 연락할 사람과의 방은 그대로 둡니다.",
    ],
    href: null,
    hrefLabel: null,
  },
  {
    id: "instagram-alerts",
    kind: "채널",
    title: "인스타그램 추천 알림 끄기",
    summary: "직접 온 메시지만 남깁니다.",
    steps: [
      "프로필의 메뉴에서 설정과 활동으로 들어갑니다.",
      "알림에서 게시물, 스토리, 추천 알림을 끕니다.",
      "메시지 알림만 켜 둡니다.",
    ],
    href: "https://www.instagram.com/accounts/settings/notifications/",
    hrefLabel: "인스타그램 알림 설정",
  },
  {
    id: "youtube-alerts",
    kind: "채널",
    title: "유튜브 추천 알림 끄기",
    summary: "구독 채널의 새 영상 알림만 남기거나 전부 끕니다.",
    steps: [
      "유튜브 프로필에서 설정, 알림으로 들어갑니다.",
      "구독, 추천 알림을 끕니다.",
      "홈 화면의 유튜브 배지도 같이 끕니다.",
    ],
    href: "https://www.youtube.com/account_notifications",
    hrefLabel: "유튜브 알림 설정",
  },
  {
    id: "slack-after-hours",
    kind: "채널",
    title: "슬랙 퇴근 후 알림 멈추기",
    summary: "회사 메신저는 끄지 못하고, 근무 시간 밖 알림만 멈춥니다.",
    steps: [
      "슬랙 프로필에서 알림, 방해 금지를 엽니다.",
      "퇴근 시각부터 다음 날 출근 시각까지 알림을 멈춥니다.",
      "긴급 키워드가 필요하면 그 단어만 예외로 둡니다.",
    ],
    href: null,
    hrefLabel: null,
  },
  {
    id: "carrier-bundle",
    kind: "구독",
    title: "통신 요금에 묶인 구독 확인하기",
    summary: "휴대폰 요금에 영상, 음악, 클라우드가 끼어 있는지 봅니다.",
    steps: [
      "통신사 앱에서 부가서비스 또는 결합 상품을 엽니다.",
      "이번 달 쓰지 않은 상품을 고릅니다.",
      "해지 예약을 하고, 다음 청구서에서 빠졌는지 확인합니다.",
    ],
    href: null,
    hrefLabel: null,
  },
  {
    id: "logout-shopping",
    kind: "계정",
    title: "습관으로 여는 쇼핑 계정 로그아웃",
    summary: "구글, 은행, 카카오 계정은 남겨 둡니다.",
    steps: [
      "자주 여는 쇼핑 앱이나 사이트에서 로그아웃합니다.",
      "홈 화면에서 그 아이콘을 빼 둡니다.",
      "다시 비밀번호를 쳐야 열리게 되면 횟수가 줄어듭니다.",
    ],
    href: null,
    hrefLabel: null,
  },
  {
    id: "home-screen",
    kind: "계정",
    title: "습관 앱을 홈 화면에서 빼기",
    summary: "지울 수 없는 앱은 화면 밖에서만 두어도 됩니다.",
    steps: [
      "아이콘을 길게 눌러 홈 화면에서 제거합니다.",
      "배지 알림도 같이 끕니다.",
      "폴더 안쪽이나 앱 서랍에만 남겨 둡니다.",
    ],
    href: null,
    hrefLabel: null,
  },
]

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[＋+]/g, "플러스")
    .replace(/\s+/g, "")
}

export function findService(
  name: string,
  services: Service[] = SERVICES,
): Service | undefined {
  const normalized = normalizeName(name)
  if (!normalized) return undefined

  let best: { service: Service; score: number } | undefined
  for (const service of services) {
    for (const alias of [service.name, ...service.aliases]) {
      const key = normalizeName(alias)
      if (key.length < 2) continue
      if (normalized.includes(key) && (!best || key.length > best.score)) {
        best = { service, score: key.length }
      }
    }
  }
  return best?.service
}

export function findCutGuide(id: string): CutGuide | undefined {
  return CUT_GUIDES.find((guide) => guide.id === id)
}
