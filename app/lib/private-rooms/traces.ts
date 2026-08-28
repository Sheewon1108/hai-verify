// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

export interface TraceLimit {
  id: string;
  possible: boolean;
  title: string;
  detail: string;
}

/**
 * Honest limits: "no traces" is an effort, not a guarantee.
 * Safer than opening Gmail or SMS — not invisible.
 */
export const PRIVATE_ROOM_TRACE_LIMITS: readonly TraceLimit[] = [
  {
    id: "no-google-sms",
    possible: true,
    title: "구글 메일·문자앱을 열지 않음",
    detail:
      "로그인·알림·백업에 Gmail, Google 계정, SMS를 쓰지 않는다. 그 앱을 여는 순간 생기는 읽음/검색/동기화 흔적은 이 방이 만들지 않는다.",
  },
  {
    id: "account-sync",
    possible: true,
    title: "같은 자리로 들어가면 그 기기에서 바로 보임",
    detail:
      "나 / 그양반 자리 + 암호로 이 호스트에 접속하면 서버에 있는 암호문을 풀어 그 컴퓨터에서 같은 낙서·복불복을 본다. 기기마다 파일을 복사하지 않는다.",
  },
  {
    id: "unlisted",
    possible: true,
    title: "공개 메뉴·검색에 안 올림",
    detail:
      "사이트 헤더, 헬스 페이지, 사이트맵에 넣지 않는다. robots / noindex / no-referrer를 건다. 주소는 아는 두 사람만 쓴다.",
  },
  {
    id: "ciphertext",
    possible: true,
    title: "디스크에는 암호문만",
    detail:
      "본문은 AES-GCM으로 잠근 뒤 gitignore된 로컬 파일에만 둔다. git 히스토리·채팅·메일 첨부로는 안 나간다.",
  },
  {
    id: "two-seats",
    possible: true,
    title: "50/50 — 나와 그양반만",
    detail:
      "자리는 owner(나)와 em(그양반) 둘뿐이다. 에이전트는 일기를 쓰지 않고, 본문을 채팅이나 커밋에 옮기지 않는다.",
  },
  {
    id: "zero-trace",
    possible: false,
    title: "흔적 0은 불가능",
    detail:
      "브라우저 주소 기록, 쿠키, 키보드/IME 캐시, 화면 캡처, OS 스왑, 이 기기의 디스크는 막을 수 없다. 노력일 뿐 보장은 아니다.",
  },
  {
    id: "network-logs",
    possible: false,
    title: "네트워크·호스트 로그는 남음",
    detail:
      "이 주소로 HTTPS/HTTP를 치면 TLS와 서버 접근 로그가 생길 수 있다. 공개 터널·Workers 배포는 더 많이 남긴다. 기본은 127.0.0.1.",
  },
  {
    id: "passphrase-holder",
    possible: false,
    title: "암호를 아는 사람 + 서버 파일",
    detail:
      "자리 암호와 저장 파일을 둘 다 가진 사람은 읽는다. 암호를 채팅/메일/문자로 보내면 그 순간 Gmail·SMS보다 위험해진다.",
  },
  {
    id: "workers-ephemeral",
    possible: false,
    title: "클라우드 워커만으로는 영구 저장 불가",
    detail:
      "Cloudflare Workers 디스크는 유지되지 않는다. 새 KV/D1을 열지 않는 한, 기기 간 유지의 본집은 로컬 호스트 파일이다.",
  },
  {
    id: "malware-shoulder",
    possible: false,
    title: "옆자리·악성코드·화면공유",
    detail:
      "화면을 보는 사람, 키로거, 원격 지원, 공유 컴퓨터 프로필은 이 방이 지우지 못한다.",
  },
] as const;
