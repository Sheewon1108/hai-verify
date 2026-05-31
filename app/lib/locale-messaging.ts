type OverallStatus = "idle" | "cleared" | "review" | "blocked";
type SignalState = "pass" | "review" | "fail";

export type MessagingInput = {
  trustIndex: number;
  humanReviewRequired: boolean;
  overallStatus: OverallStatus;
  hasCitation: boolean;
  sourceCoverage: number;
  containsPersonalData: boolean;
  mentionsLaw: boolean;
  mentionsHealth: boolean;
  mentionsMoney: boolean;
  hasSubjectiveFuture: boolean;
  failCount: number;
};

export function buildUserMessagingEn(input: MessagingInput): {
  summary: string[];
  recommendedNextStep: string;
} {
  const regulated = input.mentionsLaw || input.mentionsHealth || input.mentionsMoney;
  const ti = input.trustIndex;

  let verdict: string;
  let recommendedNextStep: string;

  if (input.overallStatus === "blocked" || input.failCount > 0) {
    verdict = `Trust Index ${ti} — risky to send as-is. Personal data or phrases like "guaranteed" stand out — address those first.`;
    recommendedNextStep =
      "Fix flagged items (PII, overconfident wording), then re-run verification. Legal, medical, or financial content needs a qualified reviewer.";
  } else if (input.humanReviewRequired) {
    if (input.hasSubjectiveFuture) {
      verdict = `Trust Index ${ti} — fine as an AI draft, but some lines read as opinion or forecast. A quick re-read before sharing helps.`;
      recommendedNextStep =
        "Have someone on your team skim it before external send. Adding sources or softening to 'may' / 'could' often raises the score.";
    } else if (regulated) {
      verdict = `Trust Index ${ti} — sensitive topics (legal, medical, financial) detected. Automated scoring alone isn't enough — human review recommended.`;
      recommendedNextStep =
        "Route to the right reviewer. Add sources and a short disclaimer on limits and jurisdiction.";
    } else {
      verdict = `Trust Index ${ti} — no major red flags, but ${ti} is shy of "send externally" territory. One more pass reduces misunderstanding.`;
      recommendedNextStep =
        "Get a quick peer or owner review before distribution. Re-verify after edits to see the score move.";
    }
  } else if (ti >= 80) {
    verdict = `Trust Index ${ti} — solid for internal use or drafts. Tone looks reasonable as-is.`;
    recommendedNextStep =
      "Good to use. For contracts, filings, or investor-facing copy, skim once more before send.";
  } else if (ti >= 60) {
    verdict = `Trust Index ${ti} — no big red flags. Tighten sources or wording and it becomes much easier to stand behind.`;
    recommendedNextStep = input.hasCitation
      ? "Citations look present. Trimming absolute claims ('always', '100%') may bump Trust Index."
      : "One link, footnote, or official reference can materially improve trust — worth five minutes.";
  } else {
    verdict = `Trust Index ${ti} — reads factual but evidence is thin. Recipients may ask where this came from.`;
    recommendedNextStep =
      "Separate facts from opinion, add numbers with sources, then re-verify. Small edits often change the score noticeably.";
  }

  const evidenceLine = input.hasCitation
    ? `Source coverage ${input.sourceCoverage}% — keep citations so claims stay traceable.`
    : `Source coverage ${input.sourceCoverage}% — a single link or footnote makes this verifiable.`;

  let domainLine: string;
  if (input.containsPersonalData) {
    domainLine = "Possible personal data detected — redact or remove before sharing.";
  } else if (input.mentionsLaw) {
    domainLine = "Legal or contract language — compliance or counsel review recommended.";
  } else if (input.mentionsHealth) {
    domainLine = "Health-related content — don't use as advice without expert review.";
  } else if (input.mentionsMoney) {
    domainLine = "Financial or tax-related content — review with regulatory context and disclaimers.";
  } else if (regulated) {
    domainLine = "Regulated-domain signals present — owner sign-off before publish.";
  } else {
    domainLine = "General business or marketing tone — no special blockers detected.";
  }

  return { summary: [verdict, evidenceLine, domainLine], recommendedNextStep };
}

export function buildSignalsEn(input: {
  hasCitation: boolean;
  length: number;
  hasOverconfidence: boolean;
  hasHedge: boolean;
  mentionsLaw: boolean;
  mentionsHealth: boolean;
  mentionsMoney: boolean;
  containsPersonalData: boolean;
}): Array<{ label: string; state: SignalState; detail: string }> {
  return [
    {
      label: "Source grounding",
      state: input.hasCitation ? "pass" : input.length > 180 ? "review" : "pass",
      detail: input.hasCitation
        ? "Citations present — claims stay traceable"
        : "No citations — one link or footnote helps a lot",
    },
    {
      label: "Calibrated language",
      state: input.hasOverconfidence ? "fail" : input.hasHedge ? "pass" : "review",
      detail: input.hasOverconfidence
        ? "Absolute phrasing ('guaranteed', '100%') — add conditions"
        : input.hasHedge
          ? "Appropriate hedging ('may', 'could')"
          : "Balance between confidence and caution could be clearer",
    },
    {
      label: "Regulated content",
      state: input.mentionsLaw || input.mentionsHealth || input.mentionsMoney ? "review" : "pass",
      detail: input.mentionsLaw
        ? "Legal / contract — reviewer sign-off recommended"
        : input.mentionsHealth
          ? "Health content — not advice without expert review"
          : input.mentionsMoney
            ? "Financial / tax — check regulatory context"
            : "General business tone",
    },
    {
      label: "Data handling",
      state: input.containsPersonalData ? "fail" : "pass",
      detail: input.containsPersonalData
        ? "Possible PII — redact before sharing"
        : "No PII patterns detected",
    },
  ];
}

export function formatScanHeadlineEn(input: {
  overallStatus: OverallStatus;
  trustIndex: number;
  failCount: number;
  humanReviewRequired: boolean;
}): string {
  if (input.overallStatus === "idle") return "Paste text to run verification.";
  if (input.overallStatus === "blocked") {
    return `Trust ${input.trustIndex} — ${input.failCount} item(s) need attention.`;
  }
  if (input.humanReviewRequired) {
    return `Trust ${input.trustIndex} — review before you send.`;
  }
  if (input.trustIndex >= 80) return `Trust ${input.trustIndex} — good to use.`;
  return `Trust ${input.trustIndex} — small edits would help.`;
}
