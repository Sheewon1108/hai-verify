import type { NextRequest } from "next/server";
import { HAI_HEADERS, HAI_RULESET_VERSION, type HaiFlowStep } from "./hai-ruleset";

export interface HaiRequestMeta {
  haiRulesetApplied: boolean;
  rulesetVersion: string;
  rulesetAppliedAt: string | null;
  flowStep: HaiFlowStep;
}

export function readHaiRequestMeta(request: NextRequest, flowStep: HaiFlowStep): HaiRequestMeta {
  return {
    haiRulesetApplied: request.headers.get(HAI_HEADERS.RULESET_ACTIVE) === "1",
    rulesetVersion: request.headers.get(HAI_HEADERS.RULESET_VERSION) ?? HAI_RULESET_VERSION,
    rulesetAppliedAt: request.headers.get(HAI_HEADERS.RULESET_APPLIED_AT),
    flowStep,
  };
}
