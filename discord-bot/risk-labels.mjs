/** Mirrors app/lib/verification.ts RISK_LABEL_MAP (ko) — UI layer only */
export const RISK_LABEL_KO = {
  missing_evidence: "글이 긴데 출처가 없어요",
  missing_source_long_text: "글이 긴데 출처가 없어요",
  overconfident_language: "'반드시·확실히' 같은 단정 표현",
  subjective_claim: "미래 전망·가치 판단 (의견에 가까움)",
  subjective_future_claim: "미래 전망·가치 판단 (의견에 가까움)",
  unverified_claim: "숫자는 있는데 근거가 없어요",
  unverified_numbers: "숫자는 있는데 근거가 없어요",
  regulated_content: "법·의료·금융인데 출처가 없어요",
  regulated_domain_no_source: "법·의료·금융인데 출처가 없어요",
  pii_detected: "개인정보처럼 보이는 내용",
  low_risk: "큰 위험 신호는 없어요",
  low_risk_cleared: "큰 위험 신호는 없어요",
};

export function formatFlagsKo(flags) {
  if (!flags?.length) return "없음";
  return flags
    .map((code) => RISK_LABEL_KO[code] ?? code.replace(/_/g, " "))
    .join(" · ");
}
