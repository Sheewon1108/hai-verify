export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type SignalState = "pass" | "review" | "fail";
export type OverallStatus = "idle" | "cleared" | "review" | "blocked";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Moderate";
  return "Low";
}

export function analyzeOutput(text: string) {
  const t = text.trim();

  const hasCitation = /\[[0-9]+\]|\b(doi:|arxiv:)\b|\bhttps?:\/\//i.test(t);
  const hasHedge = /\b(may|might|could|likely|possibly|approximately|estimate|uncertain)\b/i.test(t);
  const hasOverconfidence = /\b(always|guarantee|100%|never|proven|definitely|undeniably)\b/i.test(t);
  const hasExactNumbers = /\b\d{3,}\b|\b\d+\.\d+\b/.test(t);

  const mentionsLaw = /\b(legal|law|attorney|lawsuit|contract|liability|compliance|regulation|gdpr|hipaa)\b/i.test(t);
  const mentionsMoney = /\b(tax|irs|refund|financial advice|investment|securities|loan|interest rate)\b/i.test(t);
  const mentionsHealth = /\b(diagnos|treatment|prescription|dosage|medical|symptom|clinical)\b/i.test(t);
  const containsPersonalData = /\b(ssn|social security|passport|driver'?s license|credit card|cvv|bank account)\b/i.test(t);

  const length = t.length;
  const wordCount = t ? t.split(/\s+/).filter(Boolean).length : 0;

  let hallucinationRisk = 12;
  if (length === 0) hallucinationRisk = 0;
  if (length > 600) hallucinationRisk += 8;
  if (length > 1500) hallucinationRisk += 8;
  if (hasExactNumbers) hallucinationRisk += 6;
  if (!hasCitation && length > 180) hallucinationRisk += 14;
  if (hasOverconfidence) hallucinationRisk += 14;
  if (!hasHedge && (mentionsLaw || mentionsHealth || mentionsMoney)) hallucinationRisk += 10;
  if (mentionsLaw) hallucinationRisk += 8;
  if (mentionsHealth) hallucinationRisk += 8;
  if (mentionsMoney) hallucinationRisk += 6;
  if (containsPersonalData) hallucinationRisk += 18;
  if (hasCitation) hallucinationRisk -= 8;
  if (hasHedge) hallucinationRisk -= 5;
  hallucinationRisk = clamp(hallucinationRisk, 0, 100);

  const sourceCoverage = clamp(
    length === 0 ? 0 : hasCitation ? 78 + Math.min(17, Math.floor(wordCount / 40)) : Math.max(8, 42 - Math.floor(length / 120)),
    0,
    100,
  );

  const claimConfidence = clamp(
    length === 0 ? 0 : 72 - (hasOverconfidence ? 28 : 0) - (!hasHedge && hasExactNumbers ? 12 : 0) + (hasHedge ? 8 : 0) + (hasCitation ? 10 : 0),
    0,
    100,
  );

  const factualConsistency = clamp(
    length === 0 ? 0 : 68 - (hasExactNumbers && !hasCitation ? 18 : 0) - (hasOverconfidence ? 15 : 0) + (hasCitation ? 14 : 0) + (hasHedge ? 6 : 0),
    0,
    100,
  );

  const policyAlignment = clamp(
    length === 0 ? 0 : 85 - (containsPersonalData ? 35 : 0) - ((mentionsLaw || mentionsHealth) && !hasCitation ? 20 : 0) - (hasOverconfidence ? 12 : 0),
    0,
    100,
  );

  const trustIndex =
    length === 0
      ? 0
      : clamp(
          Math.round(
            (100 - hallucinationRisk) * 0.35 +
              sourceCoverage * 0.25 +
              claimConfidence * 0.2 +
              policyAlignment * 0.2,
          ),
          0,
          100,
        );

  const level = scoreToLevel(hallucinationRisk);
  const humanReviewRequired =
    hallucinationRisk >= 60 || containsPersonalData || mentionsLaw || mentionsHealth;

  const signals: Array<{ label: string; state: SignalState; detail: string }> = [
    {
      label: "Source grounding",
      state: hasCitation ? "pass" : length > 180 ? "review" : "pass",
      detail: hasCitation ? "Citations present" : "No citations detected",
    },
    {
      label: "Calibrated language",
      state: hasOverconfidence ? "fail" : hasHedge ? "pass" : "review",
      detail: hasOverconfidence ? "Overconfident phrasing" : hasHedge ? "Appropriate hedging" : "Limited uncertainty markers",
    },
    {
      label: "Regulated content",
      state: mentionsLaw || mentionsHealth || mentionsMoney ? "review" : "pass",
      detail: mentionsLaw ? "Legal / compliance" : mentionsHealth ? "Health / medical" : mentionsMoney ? "Financial" : "General use",
    },
    {
      label: "Data handling",
      state: containsPersonalData ? "fail" : "pass",
      detail: containsPersonalData ? "PII indicators found" : "No PII patterns",
    },
  ];

  const failCount = signals.filter((s) => s.state === "fail").length;
  const reviewCount = signals.filter((s) => s.state === "review").length;

  const summary = [
    humanReviewRequired
      ? "Route to human verifier before external distribution."
      : "Eligible for expedited review with standard attribution.",
    hasCitation
      ? `Source coverage at ${sourceCoverage}% — maintain citation chain.`
      : `Source coverage at ${sourceCoverage}% — add references to improve traceability.`,
    mentionsLaw || mentionsHealth || mentionsMoney
      ? "Regulated-domain checks apply; confirm reviewer credentials."
      : "No regulated-domain flags in current scan.",
  ];

  const reviewSla = humanReviewRequired ? "4h" : "48h";
  const queuePriority = humanReviewRequired ? "P1" : hallucinationRisk >= 45 ? "P2" : "P3";

  const overallStatus: OverallStatus =
    length === 0
      ? "idle"
      : failCount > 0 || level === "Critical"
        ? "blocked"
        : humanReviewRequired
          ? "review"
          : "cleared";

  return {
    hallucinationRisk,
    level,
    humanReviewRequired,
    metrics: { sourceCoverage, claimConfidence, factualConsistency, policyAlignment },
    signals,
    summary,
    reviewSla,
    queuePriority,
    wordCount,
    overallStatus,
    failCount,
    reviewCount,
    trustIndex,
  };
}

export function buildAuditReport(
  analysis: ReturnType<typeof analyzeOutput>,
  scanId: string | null,
) {
  const lines = [
    "HAI Verify — Audit Summary",
    scanId ? `Scan ID: ${scanId}` : "",
    `Risk band: ${analysis.level}`,
    `Hallucination risk: ${analysis.hallucinationRisk}/100`,
    `Trust index: ${analysis.trustIndex}/100`,
    `Human review: ${analysis.humanReviewRequired ? "Required" : "Optional"}`,
    "",
    "Summary:",
    ...analysis.summary.map((s) => `• ${s}`),
    "",
    "Signals:",
    ...analysis.signals.map((s) => `• ${s.label}: ${s.state} — ${s.detail}`),
  ].filter(Boolean);
  return lines.join("\n");
}

export function createScanId() {
  return `HV-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}
