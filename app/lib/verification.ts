// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Executive License & Commercial Monetization Rights: KARAM.
// Infrastructure Credits: Leveraged via Cursor, ChatGPT, Grok, Gemini, and Discord.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { buildSignalsEn, buildUserMessagingEn, formatScanHeadlineEn } from "./locale-messaging";

export type RiskFlagLocale = "ko" | "en";

export interface VerificationResult {
  trustIndex: number;
  hallucinationRisk: number;
  humanReviewRequired: boolean;
  riskFlags: string[];
  summary: string;
  recommendedNextStep: string;
  locale: RiskFlagLocale;
}

/** @deprecated Use VerificationResult */
export type VerifyApiPayload = VerificationResult;

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type SignalState = "pass" | "review" | "fail";
export type OverallStatus = "idle" | "cleared" | "review" | "blocked";
export const VERIFICATION_MODE = "auto" as const;

/** Trust Index baseline before signal adjustments (Show Me The Money / demo standard). */
export const TRUST_INDEX_BASELINE = 75;

/** User-facing labels only — internal API keeps code-style English riskFlags. */
export const RISK_LABEL_MAP: Record<string, { ko: string; en: string }> = {
  missing_source_long_text: { ko: "글이 긴 데 출처가 없어요", en: "Missing Source in Long Text" },
  overconfident_language: { ko: "너무 확신하는 말투가 있어요", en: "Overconfident Phrasing" },
  subjective_future_claim: { ko: "미래 전망이나 가치 판단이 들어 있어요", en: "Subjective Future Claim" },
  unverified_numbers: { ko: "숫자가 나오는데 근거가 없어요", en: "Unverified Numbers" },
  regulated_domain_no_source: { ko: "법·의료·금융 내용인데 출처가 없어요", en: "Regulated Domain without Source" },
  low_risk_cleared: { ko: "큰 위험 신호는 없어요", en: "Low Risk Cleared" },
  pii_detected: { ko: "개인정보처럼 보이는 내용이 있어요", en: "PII Detected" },
  // Legacy engine codes → same public labels (API unchanged)
  missing_evidence: { ko: "글이 긴 데 출처가 없어요", en: "Missing Source in Long Text" },
  subjective_claim: { ko: "미래 전망이나 가치 판단이 들어 있어요", en: "Subjective Future Claim" },
  unverified_claim: { ko: "숫자가 나오는데 근거가 없어요", en: "Unverified Numbers" },
  regulated_content: { ko: "법·의료·금융 내용인데 출처가 없어요", en: "Regulated Domain without Source" },
  low_risk: { ko: "큰 위험 신호는 없어요", en: "Low Risk Cleared" },
};

export function formatRiskFlagLabel(flag: string, locale: RiskFlagLocale): string {
  const entry = RISK_LABEL_MAP[flag];
  if (entry) return entry[locale];
  return flag.replace(/_/g, " ");
}

export function formatRiskFlagsForDisplay(
  flags: string[],
  locale: RiskFlagLocale,
): Array<{ code: string; label: string }> {
  return flags.map((code) => ({ code, label: formatRiskFlagLabel(code, locale) }));
}

/** Resolve locale from JSON body or Accept-Language (defaults to ko). */
export function parseRequestLocale(
  bodyLocale: unknown,
  acceptLanguage?: string | null,
): RiskFlagLocale {
  if (bodyLocale === "ko" || bodyLocale === "en") return bodyLocale;
  const header = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (header.startsWith("ko")) return "ko";
  if (header.startsWith("en")) return "en";
  return "ko";
}

export interface AnalysisResult {
  hallucinationRisk: number;
  level: RiskLevel;
  humanReviewRequired: boolean;
  hasCitation: boolean;
  hasExactNumbers: boolean;
  hasYearClaim: boolean;
  hasUnverifiedFactualClaim: boolean;
  isMostlySubjectiveOpinion: boolean;
  mentionsRegulated: boolean;
  metrics: {
    sourceCoverage: number;
    claimConfidence: number;
    factualConsistency: number;
    policyAlignment: number;
  };
  signals: Array<{ label: string; state: SignalState; detail: string }>;
  summary: string[];
  reviewSla: string;
  queuePriority: string;
  wordCount: number;
  overallStatus: OverallStatus;
  failCount: number;
  reviewCount: number;
  trustIndex: number;
  publicRiskFlags: string[];
  recommendedNextStep: string;
  locale: RiskFlagLocale;
}

function scoreToLevel(hallucinationRisk: number): RiskLevel {
  if (hallucinationRisk >= 85) return "Critical";
  if (hallucinationRisk >= 70) return "High";
  if (hallucinationRisk >= 45) return "Moderate";
  return "Low";
}

function derivePublicRiskFlags(input: {
  hasSubjectiveFuture: boolean;
  hasOverconfidence: boolean;
  hasStrongClaimWithoutSource: boolean;
  hasExactNumbers: boolean;
  hasCitation: boolean;
  length: number;
  containsPersonalData: boolean;
  mentionsLaw: boolean;
  mentionsHealth: boolean;
  mentionsMoney: boolean;
}): string[] {
  const flags: string[] = [];

  if (input.hasSubjectiveFuture) flags.push("subjective_claim");
  if (input.hasOverconfidence) flags.push("overconfident_language");
  if (
    input.hasStrongClaimWithoutSource ||
    (input.hasExactNumbers && !input.hasCitation && input.length > 180)
  ) {
    flags.push("unverified_claim");
  }
  if (!input.hasCitation && input.length > 180) flags.push("missing_evidence");
  if (input.containsPersonalData) flags.push("pii_detected");
  if (input.mentionsLaw || input.mentionsHealth || input.mentionsMoney) {
    flags.push("regulated_content");
  }

  return flags;
}

/** 결과 먼저 · 공감 · 다음 행동 — locale-aware user messaging */
function buildUserMessaging(
  input: {
    trustIndex: number;
    hallucinationRisk: number;
    humanReviewRequired: boolean;
    overallStatus: OverallStatus;
    hasCitation: boolean;
    sourceCoverage: number;
    containsPersonalData: boolean;
    mentionsLaw: boolean;
    mentionsHealth: boolean;
    mentionsMoney: boolean;
    hasSubjectiveFuture: boolean;
    hasOverconfidence: boolean;
    level: RiskLevel;
    failCount: number;
  },
  locale: RiskFlagLocale,
): { summary: string[]; recommendedNextStep: string } {
  if (locale === "en") {
    return buildUserMessagingEn({
      trustIndex: input.trustIndex,
      humanReviewRequired: input.humanReviewRequired,
      overallStatus: input.overallStatus,
      hasCitation: input.hasCitation,
      sourceCoverage: input.sourceCoverage,
      containsPersonalData: input.containsPersonalData,
      mentionsLaw: input.mentionsLaw,
      mentionsHealth: input.mentionsHealth,
      mentionsMoney: input.mentionsMoney,
      hasSubjectiveFuture: input.hasSubjectiveFuture,
      failCount: input.failCount,
    });
  }

  const regulated = input.mentionsLaw || input.mentionsHealth || input.mentionsMoney;
  const ti = input.trustIndex;

  let verdict: string;
  let recommendedNextStep: string;

  if (input.overallStatus === "blocked" || input.failCount > 0) {
    verdict = `Trust Index ${ti}점 — 지금 그대로 보내기엔 부담스러운 부분이 있어요. 개인정보가 노출되거나 '무조건·확실히' 같은 강한 표현이 먼저 눈에 띄네요.`;
    recommendedNextStep =
      "빨간 표시된 부분(개인정보·과한 확신 표현)을 먼저 다듬고 다시 검증해 보세요. 법·의료·금융 관련이면 해당 담당자 확인이 꼭 필요해요.";
  } else if (input.humanReviewRequired) {
    if (input.hasSubjectiveFuture) {
      verdict = `Trust Index ${ti}점 — AI 초안으로는 괜찮지만, '미래에 성장할 거예요'처럼 의견이나 전망으로 들리는 말이 들어 있어요. 고객에게 보내기 전에 30초만 더 읽어보시면 마음이 훨씬 편하실 거예요.`;
      recommendedNextStep =
        "팀에서 가볍게 한 번 리뷰한 뒤 보내는 걸 추천해요. 출처를 조금만 보강하거나 '～일 수 있어요'처럼 여지를 두는 것만으로도 신뢰도가 꽤 올라갑니다.";
    } else if (regulated) {
      verdict = `Trust Index ${ti}점 — 법·의료·금융처럼 민감한 주제가 섞여 있어요. 자동 점수만으로는 아직 부족하고, 사람의 판단이 한 번 더 필요해 보여요.`;
      recommendedNextStep =
        "해당 분야 담당자에게 넘겨 주세요. 출처와 함께 '현재 기준이며, 면책 조항이 적용될 수 있습니다' 같은 한계를 명시해 두면 훨씬 안전합니다.";
    } else {
      verdict = `Trust Index ${ti}점 — 큰 문제는 아니지만, ${ti}점대라 바로 대외에 배포하기엔 아직 조금 아쉬워요. 한 번 더 눈으로 훑어보면 오해를 줄일 수 있을 것 같아요.`;
      recommendedNextStep =
        "내부 공유 전에 동료나 담당자에게 가볍게 검토받아 보세요. 수정하고 다시 검증하면 Trust Index 변화가 바로 보여서 뿌듯할 거예요.";
    }
  } else if (ti >= 80) {
    verdict = `Trust Index ${ti}점 — 내부 공유나 초안으로 쓰기엔 충분히 무난한 수준이에요. 지금 톤 그대로 가도 크게 문제 없을 것 같아요.`;
    recommendedNextStep =
      "그대로 활용하셔도 됩니다. 다만 계약·공시·투자 설명처럼 중요한 자리라면, 보내기 직전에 한 번만 더 훑어보는 습관을 들이면 더 안심할 수 있어요.";
  } else if (ti >= 60) {
    verdict = `Trust Index ${ti}점 — 큰 red flag는 없어요. 출처와 표현만 살짝만 다듬으면 '믿고 보낼 수 있는 글'에 훨씬 가까워질 거예요.`;
    recommendedNextStep = input.hasCitation
      ? "출처는 잘 달려 있어요. '반드시·100%' 같은 단정적인 말만 조금 줄여도 Trust Index가 더 올라갈 가능성이 높아요."
      : "링크나 논문, 공식 자료 하나만 붙여도 신뢰도가 확 올라가요. 5분 정도 투자해 볼 만한 가치가 있습니다.";
  } else {
    verdict = `Trust Index ${ti}점 — 읽었을 때 사실처럼 느껴지는데 실제 근거가 약한 부분이 있어요. 그대로 두면 상대방이 '이게 어디서 나온 이야기지?' 하고 멈출 수 있어요.`;
    recommendedNextStep =
      "사실과 의견을 구분해서 적거나, 숫자·출처·조건을 조금만 채워 넣고 다시 검증해 보세요. 작은 수정으로도 체감이 확 달라질 거예요.";
  }

  const evidenceLine = input.hasCitation
    ? `출처 연결 ${input.sourceCoverage}% — 지금처럼 인용을 유지하면 '이 말이 어디서 나왔는지'가 분명해서 신뢰가 쌓여요.`
    : `출처 연결 ${input.sourceCoverage}% — 링크나 각주 하나만 추가해도 '검증 가능한 글'로 완전히 달라 보일 거예요.`;

  let domainLine: string;
  if (input.containsPersonalData) {
    domainLine = "주민번호나 카드번호처럼 보이는 개인정보가 들어 있어요. 보내기 전에 꼭 가리거나 빼 주세요.";
  } else if (input.mentionsLaw) {
    domainLine = "법률·계약 관련 이야기가 섞여 있어요. 변호사나 컴플라이언스팀 확인을 거치는 걸 강력 추천해요.";
  } else if (input.mentionsHealth) {
    domainLine = "건강·치료 관련 내용이에요. 전문가 확인 없이 조언처럼 쓰면 오해를 살 수 있으니 조심하세요.";
  } else if (input.mentionsMoney) {
    domainLine = "투자·세금 관련 내용이에요. 규제 문구와 면책 조항을 함께 검토한 뒤 보내는 게 안전합니다.";
  } else if (regulated) {
    domainLine = "민감한 분야 신호가 감지됐어요. 배포 전에 담당자 한 분만 거치면 마음이 훨씬 편할 거예요.";
  } else {
    domainLine = "일반 업무·마케팅 글로 보여요. 특별히 막을 필요는 없지만, 중요한 메시지라면 한 번 더 점검해 보세요.";
  }

  return {
    summary: [verdict, evidenceLine, domainLine],
    recommendedNextStep,
  };
}

export function formatScanHeadline(result: AnalysisResult): string {
  if (result.locale === "en") {
    return formatScanHeadlineEn({
      overallStatus: result.overallStatus,
      trustIndex: result.trustIndex,
      failCount: result.failCount,
      humanReviewRequired: result.humanReviewRequired,
    });
  }

  if (result.overallStatus === "idle") {
    return "텍스트를 붙여 넣으면 바로 검증해 드릴게요.";
  }
  if (result.overallStatus === "blocked") {
    return `Trust ${result.trustIndex}점 — 고쳐야 할 부분이 ${result.failCount}개 보여요.`;
  }
  if (result.humanReviewRequired) {
    return `Trust ${result.trustIndex}점 — 보내기 전에 한 번만 더 읽어보세요.`;
  }
  if (result.trustIndex >= 80) {
    return `Trust ${result.trustIndex}점 — 지금 상태로도 충분히 쓸 만해요.`;
  }
  return `Trust ${result.trustIndex}점 — 조금만 다듬으면 훨씬 안심돼요.`;
}

function toVerificationResult(result: AnalysisResult): VerificationResult {
  return {
    trustIndex: result.trustIndex,
    hallucinationRisk: result.hallucinationRisk,
    humanReviewRequired: result.humanReviewRequired,
    riskFlags: result.publicRiskFlags.length > 0 ? result.publicRiskFlags : ["low_risk"],
    summary: result.summary.join(" "),
    recommendedNextStep: result.recommendedNextStep,
    locale: result.locale,
  };
}

export function analyzeOutput(text: string, locale: RiskFlagLocale = "ko"): AnalysisResult {
  const t = text.trim().toLowerCase();

  // === 감지 요소 ===
  const hasCitation = /\[[0-9]+\]|\b(doi:|arxiv:)\b|\bhttps?:\/\//i.test(t);
  const hasHedge = /\b(may|might|could|likely|possibly|approximately|estimate|uncertain)\b/i.test(t);
  const hasOverconfidence = /\b(always|guarantee|100%|never|proven|definitely|undeniably|반드시|무조건|확실히)\b/i.test(t);
  const hasExactNumbers = /\b\d{3,}\b|\b\d+\.\d+\b/.test(t);

  const mentionsLaw = /\b(legal|law|attorney|lawsuit|contract|liability|compliance|regulation|gdpr|hipaa)\b/i.test(t);
  const mentionsMoney = /\b(tax|irs|refund|financial advice|investment|securities|loan|interest rate)\b/i.test(t);
  const mentionsHealth = /\b(diagnos|treatment|prescription|dosage|medical|symptom|clinical)\b/i.test(t);
  const containsPersonalData = /\b(ssn|social security|passport|driver'?s license|credit card|cvv|bank account)\b/i.test(t);

  const hasSubjectiveFuture = /(미래 가치|성장할|성공할|가능성|될 것이다|최고가 될|앞으로 기대)/i.test(t);
  const hasStrongClaimWithoutSource = hasOverconfidence && !hasCitation;

  const length = t.length;
  const wordCount = t ? t.split(/\s+/).filter(Boolean).length : 0;

  // === Trust Index 계산 (75점 기준) ===
  let trustIndex = length === 0 ? 0 : TRUST_INDEX_BASELINE;

  if (length > 0) {
    if (hasCitation) trustIndex += 8;
    if (hasHedge) trustIndex += 5;
    if (!hasCitation && length > 180) trustIndex -= 12;
    if (hasOverconfidence) trustIndex -= 12;
    if (hasSubjectiveFuture && !hasCitation) trustIndex -= 14;
    if (hasStrongClaimWithoutSource) trustIndex -= 12;
    if (hasExactNumbers && !hasCitation) trustIndex -= 10;
    if ((mentionsLaw || mentionsHealth || mentionsMoney) && !hasCitation) trustIndex -= 10;
    if (containsPersonalData) trustIndex -= 18;
  }

  trustIndex = Math.max(0, Math.min(100, Math.round(trustIndex)));

  // === Hallucination Risk (참고용) ===
  let hallucinationRisk = length === 0 ? 0 : 20;

  if (length > 0) {
    if (!hasCitation && length > 180) hallucinationRisk += 14;
    if (hasOverconfidence) hallucinationRisk += 14;
    if (hasSubjectiveFuture && !hasCitation) hallucinationRisk += 16;
    if (hasStrongClaimWithoutSource) hallucinationRisk += 12;
    if (containsPersonalData) hallucinationRisk += 16;
    if (hasCitation) hallucinationRisk -= 6;
    if (hasHedge) hallucinationRisk -= 4;
  }

  hallucinationRisk = Math.max(0, Math.min(100, Math.round(hallucinationRisk)));

  const level = scoreToLevel(hallucinationRisk);
  const humanReviewRequired =
    hallucinationRisk >= 55 ||
    containsPersonalData ||
    mentionsLaw ||
    mentionsHealth ||
    hasSubjectiveFuture;

  const signalInput = {
    hasCitation,
    length,
    hasOverconfidence,
    hasHedge,
    mentionsLaw,
    mentionsHealth,
    mentionsMoney,
    containsPersonalData,
  };

  const signalsKo = [
    {
      label: "Source grounding",
      state: hasCitation ? "pass" : length > 180 ? "review" : "pass",
      detail: hasCitation
        ? "출처가 달려 있어요 — 나중에도 어디서 나온 말인지 추적하기 쉬워요"
        : "출처가 없어요 — 링크나 각주 하나만 있어도 훨씬 믿음직해져요",
    },
    {
      label: "Calibrated language",
      state: hasOverconfidence ? "fail" : hasHedge ? "pass" : "review",
      detail: hasOverconfidence
        ? "'반드시·100%'처럼 너무 단정한 말이 있어요 — 조건이나 여지를 적어 두면 훨씬 안전해요"
        : hasHedge
          ? "‘~일 수 있어요’처럼 여지를 두고 있어요 — 좋은 톤이에요"
          : "확신과 보수 사이 균형이 애매해요 — 과장만 피하면 충분히 괜찮아질 수 있어요",
    },
    {
      label: "Regulated content",
      state: mentionsLaw || mentionsHealth || mentionsMoney ? "review" : "pass",
      detail: mentionsLaw
        ? "법·계약 얘기 — 담당자 한 분만 거치면 마음이 편해요"
        : mentionsHealth
          ? "건강·치료 내용 — 전문가 확인 없이 조언처럼 쓰지 않는 게 안전해요"
          : mentionsMoney
            ? "투자·세금 내용 — 규제·면책 문구와 함께 검토해 주세요"
            : "일반 업무·마케팅 글로 보여요",
    },
    {
      label: "Data handling",
      state: containsPersonalData ? "fail" : "pass",
      detail: containsPersonalData
        ? "개인정보처럼 보이는 내용이 있어요 — 보내기 전에 꼭 가리거나 빼 주세요"
        : "개인정보 패턴은 보이지 않아요",
    },
  ] as AnalysisResult["signals"];

  const signals =
    locale === "en" ? (buildSignalsEn(signalInput) as AnalysisResult["signals"]) : signalsKo;

  const failCount = signals.filter((s) => s.state === "fail").length;
  const reviewCount = signals.filter((s) => s.state === "review").length;

  const sourceCoverage = Math.round(
    hasCitation ? 78 + Math.min(17, Math.floor(wordCount / 40)) : Math.max(8, 42 - Math.floor(length / 120)),
  );

  const overallStatus: OverallStatus =
    length === 0
      ? "idle"
      : failCount > 0 || level === "Critical"
        ? "blocked"
        : humanReviewRequired
          ? "review"
          : "cleared";

  const { summary, recommendedNextStep } = buildUserMessaging(
    {
      trustIndex,
      hallucinationRisk,
      humanReviewRequired,
      overallStatus,
      hasCitation,
      sourceCoverage,
      containsPersonalData,
      mentionsLaw,
      mentionsHealth,
      mentionsMoney,
      hasSubjectiveFuture,
      hasOverconfidence,
      level,
      failCount,
    },
    locale,
  );

  const reviewSla = humanReviewRequired ? "4h" : "48h";
  const queuePriority = humanReviewRequired ? "P1" : hallucinationRisk >= 45 ? "P2" : "P3";

  const publicRiskFlags = derivePublicRiskFlags({
    hasSubjectiveFuture,
    hasOverconfidence,
    hasStrongClaimWithoutSource,
    hasExactNumbers,
    hasCitation,
    length,
    containsPersonalData,
    mentionsLaw,
    mentionsHealth,
    mentionsMoney,
  });

  return {
    hallucinationRisk,
    level,
    humanReviewRequired,
    hasCitation,
    hasExactNumbers,
    hasYearClaim: /\b(19|20)\d{2}\b/.test(t),
    hasUnverifiedFactualClaim:
      hasStrongClaimWithoutSource || (hasExactNumbers && !hasCitation && length > 180),
    isMostlySubjectiveOpinion: hasSubjectiveFuture && !hasExactNumbers,
    mentionsRegulated: mentionsLaw || mentionsHealth || mentionsMoney,
    metrics: {
      sourceCoverage,
      claimConfidence: 70,
      factualConsistency: 68,
      policyAlignment: 80,
    },
    signals,
    summary,
    reviewSla,
    queuePriority,
    wordCount,
    overallStatus,
    failCount,
    reviewCount,
    trustIndex,
    publicRiskFlags,
    recommendedNextStep,
    locale,
  };
}

// 기존 API 호환용
export function runVerification(content: string, locale: RiskFlagLocale = "ko"): VerificationResult {
  return toVerificationResult(analyzeOutput(content, locale));
}

export function mapAnalysisToVerifyPayload(result: VerificationResult): VerificationResult {
  return result;
}

export function analyzeOutputForDemo(text: string, locale: RiskFlagLocale = "ko"): AnalysisResult {
  return analyzeOutput(text, locale);
}

export function buildAuditReport(result: AnalysisResult, scanId?: string) {
  const lines = [
    "HAI Verify — Report",
    scanId ? `Scan ID: ${scanId}` : "",
    `Trust Index: ${result.trustIndex}/100`,
    `Hallucination risk: ${result.hallucinationRisk}/100`,
    "",
    result.summary.map((s) => `• ${s}`).join("\n"),
  ].filter(Boolean);
  return lines.join("\n");
}

export function createScanId() {
  return `HV-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}
