/** Canonical user-context policy — also used for future product positioning. */
import { areaCodeZoneHint, PHONE_AREA_POLICY_EN, PHONE_AREA_POLICY_KO } from "./phone-area-policy";
import {
  TIMEZONE_MODEL_POLICY_EN,
  TIMEZONE_MODEL_POLICY_KO,
  inferenceRuleForModel,
  resolveTimezoneModel,
  type TimezoneModel,
} from "./timezone-model-policy";

export { PHONE_AREA_POLICY_EN, PHONE_AREA_POLICY_KO, areaCodeZoneHint, parseUsAreaCode } from "./phone-area-policy";
export {
  TIMEZONE_MODEL_POLICY_EN,
  TIMEZONE_MODEL_POLICY_KO,
  inferenceRuleForModel,
  listMultiTimezoneCountries,
  resolveTimezoneModel,
  type TimezoneModel,
} from "./timezone-model-policy";

export const USER_CONTEXT_POLICY_KO =
  "어떤 언어를 사용하던, 어디에 있던 — AI와 도구는 위치를 언어로 추측하거나 유추하지 않아야 한다.";

export const USER_CONTEXT_POLICY_EN =
  "Whatever language you use, wherever you are — AI and tools must not infer location from language.";

export const US_TIMEZONE_POLICY_EN =
  "In the US, Pacific, Mountain, Central, and Eastern are different zones — never infer them from English or en-US.";

export const US_TIMEZONE_POLICY_KO =
  "미국 내에서도 서부·산악·중부·동부 시간대는 다릅니다 — 영어 사용만으로 추측하면 안 됩니다.";

export const USER_CONTEXT_RULES = {
  timezoneFrom: ["USER_TIMEZONE"] as const,
  residenceFrom: ["USER_REGION", "USER_COUNTRY"] as const,
  languageFor: ["display", "messaging", "locale"] as const,
  neverInferLocationFrom: [
    "language",
    "English",
    "en-US",
    "ko-KR",
    "Accept-Language",
    "conversation",
    "phone area code",
    "USER_CONTACT_PHONE",
  ] as const,
  multiTimezoneCountries: {
    rule: "Zone inference FORBIDDEN from any signal (worldwide)",
    scope: "global",
  } as const,
  singleTimezoneCountries: {
    rule: "One national zone (zone pick N/A); location-from-language still FORBIDDEN",
    examples: ["Korea (KST)", "Japan (JST)"],
  } as const,
  usZones: ["Pacific", "Mountain", "Central", "Eastern"] as const,
} as const;

export function describeContextDecoupling(opts: {
  region: string;
  timezone: string;
  country?: string | null;
  contactPhone?: string | null;
}): string[] {
  const notes: string[] = [];
  const model = resolveTimezoneModel(opts.region, opts.country);
  notes.push(inferenceRuleForModel(model));

  const phoneHint = opts.contactPhone ? areaCodeZoneHint(opts.contactPhone) : null;
  if (model === "multi" && phoneHint?.timezone && phoneHint.timezone !== opts.timezone) {
    notes.push(
      `Phone area suggests ${phoneHint.label} but USER_TIMEZONE is ${opts.timezone} — decoupled (OK)`,
    );
  }
  if (model === "multi" && /california|pacific|west/i.test(opts.region) && opts.timezone === "Eastern Standard Time") {
    notes.push("West residence with Eastern USER_TIMEZONE — explicit choice (OK)");
  }
  if (model === "single") {
    notes.push("Single-timezone country: no domestic zone ambiguity; USER_TIMEZONE still required for tools");
  }
  return notes;
}