import {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_FLOOR,
  HAI_IC_DD_MAX_PENALTY,
} from "./hai-ic-system-prompt";

export const HAI_IC_PRODUCT = "hai-ic";
export const HAI_IC_VERSION = "1.0.0-mvp";

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcResult {
  product: typeof HAI_IC_PRODUCT;
  version: typeof HAI_IC_VERSION;
  confidence: number;
  sincereMode: boolean;
  mode: string;
  breakdown: HaiIcBreakdown;
  questions: string[];
  response: string;
  analyzedAt: string;
  isDueDiligence?: boolean;
}

const VAGUE_PATTERNS = [
  /어떻게|뭐가 좋|좋을까|알려줘|도와줘|추천|조언|how should|what should|help me|any ideas/i,
  /다시|재개|복구|reconnect|again/i,
  /거래|협력|파트너|business|deal|partner/i,
];

const DD_PATTERNS = [
  /before\s*\/\s*after|실제\s*데이터|수치\s*증거|벤치마크|benchmark/i,
  /latency|지연|false\s*positive|hallucination\s*rate/i,
  /검증|호환|compatibility|통합\s*난이도|연동/i,
  /training\s*data|bias|contamination|학습\s*데이터/i,
  /licensing|독점|가격대|ROI|ip\s*ownership|소유권|modify/i,
  /due\s*diligence|실사|poc|로드맵|align/i,
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

function isDueDiligenceQuestion(text: string): boolean {
  return DD_PATTERNS.filter((p) => p.test(text)).length >= 1;
}

function clip(text: string, max = 120): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function buildQuestions(text: string, wantsBusiness: boolean, wantsRestart: boolean, isDD: boolean): string[] {
  const questions: string[] = [];

  if (isDD) {
    questions.push("이 DD 항목에 대해 지금 바로 제시 가능한 자료(수치·POC·벤치마크)는 무엇인가요?");
    questions.push("측정 기간·샘플 크기·비교 기준(baseline)을 어떻게 잡을까요?");
    questions.push("xAI/파트너 미팅 전에 공개 가능한 범위(NDA 포함)는 어디까지인가요?");
    return questions;
  }

  if (wantsBusiness) {
    questions.push("귀하와 상대·중간 채널(예: 물류사)의 역할 관계는 무엇인가요?");
  }
  if (wantsRestart) {
    questions.push("이전에 무엇을 거래했고, 왜·언제 관계가 끊겼나요?");
  }
  if (!/\d/.test(text)) {
    questions.push("희망 기한·규모·예산(또는 물동량)은 어느 정도인가요?");
  }
  if (questions.length < 2) {
    questions.push("이번 요청의 성공 기준을 한 문장으로 정의해 주실 수 있나요?");
  }
  if (questions.length < 3) {
    questions.push("지금 가장 먼저 해결해야 할 제약(법적·예산·승인)이 있나요?");
  }

  return questions.slice(0, 3);
}

function buildSincereResponse(text: string, entities: string[], isDD: boolean): string {
  if (isDD) {
    return [
      "DD(실사) 질문으로 분류했습니다. 진심 모드로 답변 프레임을 제시합니다.",
      "",
      "**현재 가능한 답변 범위**",
      "- 아키텍처·연동 방식: API pre-check 레이어로 설명 가능",
      "- 수치·검증 항목: POC 설계안 + 측정 지표 제안 가능",
      "",
      "**다음 액션 (미팅 전)**",
      "1. 해당 질문 1페이지 기술 브리프 작성",
      "2. 2주 POC 범위·latency/FP 벤치마크 계획 공유",
      "3. NDA 하에 공개 가능한 자료 목록 정리",
      "",
      "원하시면 이 DD 항목 전용 답변 초안을 바로 작성해 드립니다.",
    ].join("\n");
  }

  const target = entities[0] ?? "상대";
  return [
    "맥락이 충분히 잡혔습니다. 진심 모드로 진행합니다.",
    "",
    `**목표 고정** — "${clip(text, 60)}" 를 한 줄 목표로 문서화하세요.`,
    "",
    `**접촉 순서 (${target})**`,
    "1. 과거 담당자·부서 확인",
    "2. 재연락 사유 + 제공 가치 3문장",
    "3. 구체 일정·규모·다음 액션 제안",
    "",
    "**리스크 체크**",
    "- 과거 미수·품질·계약 이슈 선정리",
    "- 내부 승인권자·예산 확보 여부 확인",
    "",
    "원하시면 첫 연락 메일/메시지 초안을 바로 작성해 드립니다.",
  ].join("\n");
}

function buildLowScoreResponse(questions: string[], isDD: boolean, confidence: number): string {
  const hope = isDD
    ? "이 질문은 DD 항목입니다. 지금 점수가 낮아도 **POC·파일럿 데이터**만 준비하면 신뢰를 빠르게 올릴 수 있습니다."
    : "의도 방향은 읽혔습니다. 조금만 구체화하면 Intent Confidence가 바로 올라갑니다.";

  const actions = isDD
    ? [
        "**다음 액션**",
        "1. DD 항목별 1페이지 브리프 (현재 가능 / 준비 중 / 미정)",
        "2. 2주 POC 일정 + 측정 지표(latency, FP rate 등) 합의",
        "3. Growth Loops / xAI 미팅용 체크리스트 공유",
      ]
    : [
        "**다음 액션**",
        "1. 아래 질문 2~3개에 짧게 답하기",
        "2. 성공 기준 한 문장으로 고정",
        "3. 다시 분석 요청",
      ];

  return [
    `Intent Confidence ${confidence}% — 아직 진심 모드(75%) 미만입니다.`,
    "",
    `**희망** — ${hope}`,
    "",
    ...actions,
    "",
    "**더 명확히 말해줄래?**",
    ...questions.map((q, i) => `${i + 1}. ${q}`),
  ].join("\n");
}

export function analyzeIntent(input: string): HaiIcResult {
  const text = input.trim();
  const isDD = isDueDiligenceQuestion(text);
  let confidence = 78;

  if (text.length < 15) confidence -= 18;
  else if (text.length < 40) confidence -= 6;
  else if (text.length > 120) confidence += 6;

  const vagueHits = VAGUE_PATTERNS.filter((p) => p.test(text)).length;
  const specificHits = SPECIFIC_PATTERNS.filter((p) => p.test(text)).length;

  confidence -= vagueHits * 5;
  confidence += specificHits * 7;

  if (hasProperNoun(text)) confidence += 8;
  if (!/[?.!？]/.test(text)) confidence -= 4;
  if (/(왜|언제|무엇|누구|where|when|why|who)/i.test(text)) confidence -= 5;

  confidence = Math.max(35, Math.min(96, Math.round(confidence)));

  if (isDD) {
    confidence = Math.max(confidence - HAI_IC_DD_MAX_PENALTY, HAI_IC_DD_FLOOR);
  }

  const wantsStrategy = /어떻게|접근|전략|방법|좋을까|how/i.test(text);
  const wantsBusiness = /거래|협력|파트너|물류|business|deal/i.test(text);
  const wantsRestart = /다시|재개|복구|again/i.test(text);

  const entities = text.match(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*|[가-힣]{2,}(?:그룹|물류)/g) ?? [];

  const coreParts: string[] = [];
  if (isDD) coreParts.push("DD(실사) / 기술·상용 검증 질문");
  if (wantsBusiness) coreParts.push("비즈니스·거래 관련 요청");
  if (wantsStrategy) coreParts.push("실행 전략·접근 방법 문의");
  if (wantsRestart) coreParts.push("관계·거래 재개 의도");
  const core =
    coreParts.length > 0 ? coreParts.join(", ") : "일상어 요청의 목적 파악 및 다음 행동 안내";

  const understood: string[] = [];
  if (entities.length > 0) understood.push(`언급된 대상: ${entities.slice(0, 3).join(", ")}`);
  if (isDD) understood.push("수치·검증·법무·통합 증거를 요구하는 실사형 질문");
  if (wantsStrategy) understood.push("방법·접근 순서에 대한 조언을 원함");
  if (wantsBusiness) understood.push("상대와의 거래·협력 맥락");
  if (understood.length === 0) understood.push(`요청 문장: "${clip(text, 80)}"`);

  const missing: string[] = [];
  if (isDD) missing.push("before/after 수치, 벤치마크, 검증 로그 등 공식 증거 미제시");
  if (entities.length < 2 && wantsBusiness) missing.push("상대·채널·역할 중 일부가 불명확");
  if (!/\d/.test(text)) missing.push("기한·규모·예산 등 수치 정보 없음");
  if (wantsRestart) missing.push("과거 관계·중단 사유·이전 거래 내용 미기재");
  if (vagueHits >= 2) missing.push("요청이 넓어 우선순위·성공 기준이 모호함");
  if (missing.length === 0) missing.push("세부 조건 일부는 추가 확인 필요");

  const risk: string[] = [];
  const sincere = confidence >= HAI_IC_CONFIDENCE_THRESHOLD;
  if (isDD && !sincere) risk.push("증거 없이 수치를 주장하면 DD 미팅에서 신뢰 손실");
  if (!sincere) risk.push("정보 부족 상태에서 실행하면 잘못된 담당자·전략으로 접근할 수 있음");
  if (wantsRestart) risk.push("과거 이슈 미정리 시 재거절·신뢰 손상 가능");
  if (wantsBusiness && !/\d/.test(text)) risk.push("규모·조건 불명확 시 제안 설득력 약화");
  if (risk.length === 0) risk.push("맥락은 비교적 분명하나 실행 전 최종 확인 권장");

  const questions = sincere ? [] : buildQuestions(text, wantsBusiness, wantsRestart, isDD);

  const response = sincere
    ? buildSincereResponse(text, entities, isDD)
    : buildLowScoreResponse(questions, isDD, confidence);

  return {
    product: HAI_IC_PRODUCT,
    version: HAI_IC_VERSION,
    confidence,
    sincereMode: sincere,
    mode: sincere ? "진심 모드 ON" : "진심 모드 OFF",
    breakdown: {
      core,
      understood: understood.join(" · "),
      missing: missing.join(" · "),
      risk: risk.join(" · "),
    },
    questions,
    response,
    analyzedAt: new Date().toISOString(),
    isDueDiligence: isDD,
  };
}