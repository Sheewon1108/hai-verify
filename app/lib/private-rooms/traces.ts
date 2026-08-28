// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

export type TraceKind = "reduced" | "impossible";

export interface TraceItem {
  id: string;
  kind: TraceKind;
  title: string;
  detail: string;
}

export const TRACE_ITEMS: readonly TraceItem[] = [
  {
    id: "no-gmail-index",
    kind: "reduced",
    title: "구글메일 색인·광고 프로필",
    detail:
      "본문을 Gmail에 두지 않는다. 검색·스마트회신·광고 쪽 메일 색인은 이 방에 없다.",
  },
  {
    id: "no-sms-carrier",
    kind: "reduced",
    title: "문자앱·통신사 보관",
    detail:
      "SMS/RCS에 안 넣는다. 통신사·기본 문자앱 백업 경로를 이 글에 쓰지 않는다.",
  },
  {
    id: "no-public-nav",
    kind: "reduced",
    title: "공개 메뉴·검색엔진",
    detail:
      "사이트 메뉴에 안 올린다. noindex/noarchive. 본문은 서버 로그에 안 남기려고 암호문으로만 저장한다.",
  },
  {
    id: "two-seats",
    kind: "reduced",
    title: "50/50 열람",
    detail:
      "좌석은 나와 그 양반만. 제3 좌석 없음. 블라인드: 다른 사람은 설명만, 방 내용은 못 봄.",
  },
  {
    id: "host-logs",
    kind: "impossible",
    title: "접속 로그",
    detail:
      "서버/클라우드가 IP·시각·경로를 남길 수 있다. 본문을 로그에 안 써도 메타는 남을 수 있다.",
  },
  {
    id: "tls-sni",
    kind: "impossible",
    title: "네트워크가 보는 도메인",
    detail:
      "HTTPS여도 SNI/DNS로 어느 호스트에 붙었는지는 네트워크가 볼 수 있다.",
  },
  {
    id: "browser-history",
    kind: "impossible",
    title: "브라우저 방문 기록",
    detail:
      "주소창 기록, 자동완성, 탭 제목은 OS/브라우저 쪽에 남는다. 끝난 뒤 탭을 닫는 게 맞다.",
  },
  {
    id: "device-ime",
    kind: "impossible",
    title: "키보드·스크린샷·스왑",
    detail:
      "IME 학습, 화면 캡처, 크래시 덤프, 클라우드 키보드 동기화는 이 앱이 지울 수 없다.",
  },
  {
    id: "admin-secrets",
    kind: "impossible",
    title: "열쇠를 가진 관리자",
    detail:
      "이 서버 설정/백업을 읽는 사람은 암호문과 해시에는 닿는다. 본문 열쇠는 접속 암호에서만 나온다.",
  },
  {
    id: "chat-paste",
    kind: "impossible",
    title: "이 채팅에 붙여넣기",
    detail:
      "여기 본문을 채팅·커밋·이메일에 붙이면 그 서비스 기록이 원본이 된다. 방에만 쓴다.",
  },
] as const;

export function tracesByKind(kind: TraceKind): TraceItem[] {
  return TRACE_ITEMS.filter((item) => item.kind === kind);
}
