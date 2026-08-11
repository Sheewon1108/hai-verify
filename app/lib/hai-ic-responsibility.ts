export const HAI_IC_FINAL_DECISION_OWNER = "human" as const;

export type HaiIcActionPermission =
  | "allowed_after_human_approval"
  | "blocked_pending_clarification";

export interface HaiIcResponsibilityGate {
  finalDecisionOwner: typeof HAI_IC_FINAL_DECISION_OWNER;
  humanApprovalRequired: true;
  actionPermission: HaiIcActionPermission;
  reason: string;
}

export function buildHaiIcResponsibilityGate(sincereMode: boolean): HaiIcResponsibilityGate {
  return {
    finalDecisionOwner: HAI_IC_FINAL_DECISION_OWNER,
    humanApprovalRequired: true,
    actionPermission: sincereMode
      ? "allowed_after_human_approval"
      : "blocked_pending_clarification",
    reason: sincereMode
      ? "Intent Confidence passed the Sincere Mode threshold; a human still makes the final decision."
      : "Intent Confidence is below the Sincere Mode threshold; clarify before any AI action.",
  };
}
