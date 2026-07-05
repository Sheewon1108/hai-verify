import { HAI_IC_CONFIDENCE_THRESHOLD } from "./hai-ic-system-prompt";

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcResult {
  confidence: number;
  mode: string;
  breakdown: HaiIcBreakdown;
  response: string;
}

const VAGUE_PATTERNS = [
  /어떻게|뭐가 좋|좋을까|알려줘|도와줘|추천|조언|how should|what should|help me|any ideas/i,
  /다시|재개|복구|reconnect|again/i,
  /거래|협력|파트너|business|deal|partner/i,
];

const SPECIFIC_PATTERNS = [
  /\d{4}[-./년]\s*\d{1,2}/,
  /\d+\s*(만|억|천|원|달러|usd|%|톤|개월)/i,
  /(주식회사|\(주\)|group|corp|inc|ltd)/i,
  /(물류|logistics|수출|수입|구매|판매|납품)/i,
];

function hasProperNoun(text: string): boolean {
  return /[A-Z][a-z]+|[가-힣]{2,}(그룹|물류|회사|전자|산업)/.test(text);
}

function clip(text: string, max = 120): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function analyzeIntent(input: string): HaiIcResult {
  const text = input.trim();
  const lower = text.toLowerCase();
  let confidence = 72;

  if (text.length < 15) confidence -= 25;
  else if (text.length < 40) confidence -= 12;
  else if (text.length > 120) confidence += 6;

  const vagueHits = VAGUE_PATTERNS.filter((p) => p.test(text)).length;
  const specificHits = SPECIFIC_PATTERNS.filter((p) => p.test(text)).length;

  confidence -= vagueHits * 8;
  confidence += specificHits * 7;

  if (hasProperNoun(text)) confidence += 8;
  if (!/[?.!？]/.test(text)) confidence -= 4;
  if (/(왜|언제|무엇|누구|where|when|why|who)/i.test(text)) confidence -= 5;

  confidence = Math.max(18, Math.min(96, Math.round(confidence)));

  const wantsStrategy = /어떻게|접근|전략|방법|좋을까|how/i.test(text);
  const wantsBusiness = /거래|협력|파트너|물류|business|deal/i.test(text);
  const wantsRestart = /다시|재개|복구|again/i.test(text);

  const entities = text.match(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*|[가-힣]{2,}(?:그룹|물류)/g) ?? [];

  const coreParts: string[] = [];
  if (wantsBusiness) coreParts.push("비즈니스·거래 관련 요청");
  if (wantsStrategy) coreParts.push("실행 전략·접근 방법 문의");
  if (wantsRestart) coreParts.push("관계·거래 재개 의도");
  const core =
    coreParts.length > 0
      ? coreParts.join(", ")
      : "일상어 요청의 목적 파악 및 다음 행동 안내";

  const understood: string[] = [];
  if (entities.length > 0) understood.push(`언급된 대상: ${entities.slice(0, 3).join(", ")}`);
  if (wantsStrategy) understood.push("방법·접근 순서에 대한 조언을 원함");
  if (wantsBusiness) understood.push("상대와의 거래·협력 맥락");
  if (understood.length === 0) understood.push(`요청 문장: "${clip(text, 80)}"`);

  const missing: string[] = [];
  if (entities.length < 2 && wantsBusiness) missing.push("상대·채널·역할 중 일부가 불명확");
  if (!/\d/.test(text)) missing.push("기한·규모·예산 등 수치 정보 없음");
  if (wantsRestart) missing.push("과거 관계·중단 사유·이전 거래 내용 미기재");
  if (vagueHits >= 2) missing.push("요청이 넓어 우선순위·성공 기준이 모호함");
  if (missing.length === 0) missing.push("세부 조건 일부는 추가 확인 필요");

  const risk: string[] = [];
  if (confidence < HAI_IC_CONFIDENCE_THRESHOLD)
    risk.push("정보 부족 상태에서 실행하면 잘못된 담당자·전략으로 접근할 수 있음");
  if (wantsRestart) risk.push("과거 이슈 미정리 시 재거절·신뢰 손상 가능");
  if (wantsBusiness && !/\d/.test(text)) risk.push("규모·조건 불명확 시 제안 설득력 약화");
  if (risk.length === 0) risk.push("맥락은 비교적 분명하나 실행 전 최종 확인 권장");

  const sincere = confidence >= HAI_IC_CONFIDENCE_THRESHOLD;

  const response = sincere
    ? [
        "맥락이 충분히 잡혔습니다. 진심 모드로 진행합니다.",
        "",
        "1. **현황 정리** — 목표, 상대, 채널, 과거 이력을 한 줄로 고정하세요.",
        "2. **접촉 순서** — 과거 담당자 → 해당 부서 → 소개·레퍼런스 순으로 좁혀 가세요.",
        "3. **첫 메시지** — 재연락 이유, 제공 가치, 구체 일정·규모를 3문장 안에 담으세요.",
        "4. **리스크 체크** — 미수·품질·계약 이슈가 있었다면 먼저 정리한 뒤 접근하세요.",
        "",
        "원하시면 첫 연락 메일/메시지 초안까지 바로 작성해 드리겠습니다.",
      ].join("\n")
    : [
        "아직 Intent Confidence가 충분하지 않아, 먼저 아래를 알려주시면 더 정확한 접근안을 드릴 수 있습니다.",
        "",
        "1. **역할·채널** — 귀하와 중간 채널(예: 물류사)의 관계는 무엇인가요?",
        "2. **과거 이력** — 이전에 무엇을 거래했고, 왜·언제 끊겼나요?",
        "3. **이번 목표** — 재개하려는 품목·규모·희망 시기는 무엇인가요?",
      ].join("\n");

  return {
    confidence,
    mode: sincere ? "진심 모드 ON" : "진심 모드 OFF",
    breakdown: {
      core,
      understood: understood.join(" · "),
      missing: missing.join(" · "),
      risk: risk.join(" · "),
    },
    response,
  };
}