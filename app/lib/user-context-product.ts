/**
 * HAI User Context — planned product tiers (hai-user-context).
 * Language policy: free (awareness + basic rules).
 * Timezone bundle: paid (assert, global multi-country model, guards, scheduling).
 */

export const PRODUCT_NAME = "hai-user-context";

export const PRODUCT_TIERS = {
  free: {
    id: "language-policy",
    name: "Language decoupling (free)",
    includes: [
      "Never infer residence from language, locale, or Accept-Language",
      "USER_DISPLAY_LOCALE for UI/messaging only",
      "Policy constants + health API policy fields",
      "Open-source docs and examples",
    ],
  },
  paid: {
    id: "timezone-bundle",
    name: "Timezone bundle (paid)",
    includes: [
      "USER_TIMEZONE assert (Windows sync)",
      "Global multi-timezone model (inference FORBIDDEN)",
      "Phone area code decoupling",
      "Scheduled-task timezone guards",
      "security-watch user-context checks",
      "4-zone US assert test + scenario runner",
      "DPAPI vault integration hooks",
    ],
    rationale:
      "Timezone is more complex than language, needs OS integration, and higher product completion cost.",
  },
} as const;

export const PRODUCT_PITCH_EN =
  "Language policy free forever. Timezone accuracy bundled — because getting time right is harder than getting language right.";

export const PRODUCT_PITCH_KO =
  "언어 정책은 무료 배포. 시간대는 복잡도가 높아 번들 유료 — 언어보다 완성에 더 많은 시간이 듭니다.";