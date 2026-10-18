// Copyright 2026 KARAM. All Rights Reserved.

import { HAI_CORE_COMMAND } from "./hai-ruleset";

/** Cookie preference categories shown on the privacy choice screen. */
export type CookieCategory = "functional" | "performance" | "targeting";

export type CookiePreferences = {
  functional: boolean;
  performance: boolean;
  targeting: boolean;
};

export type PrivacyConsentRecord = {
  version: 1;
  preferences: CookiePreferences;
  /** ISO timestamp when the human approved proceeding to cookie choice. */
  humanApprovedAt: string;
  /** Intent Confidence % measured before approval. */
  intentConfidence: number;
  /** ISO timestamp when preferences were saved. */
  savedAt: string;
  coreCommand: typeof HAI_CORE_COMMAND;
};

/** Ordered gate steps before cookie preferences may be chosen. */
export type PrivacyGateStep =
  | "core-command"
  | "intent-measure"
  | "human-approve"
  | "cookie-choice";

export const PRIVACY_CONSENT_STORAGE_KEY = "hai-verify-privacy-consent-v1" as const;

export const PRIVACY_GATE_STEPS: readonly PrivacyGateStep[] = [
  "core-command",
  "intent-measure",
  "human-approve",
  "cookie-choice",
] as const;

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  functional: true,
  performance: false,
  targeting: false,
};

export function canEnterCookieChoice(input: {
  coreCommandAcknowledged: boolean;
  intentMeasured: boolean;
  humanApproved: boolean;
}): boolean {
  return (
    input.coreCommandAcknowledged &&
    input.intentMeasured &&
    input.humanApproved
  );
}

export function nextPrivacyGateStep(
  current: PrivacyGateStep,
): PrivacyGateStep | null {
  const idx = PRIVACY_GATE_STEPS.indexOf(current);
  if (idx < 0 || idx >= PRIVACY_GATE_STEPS.length - 1) return null;
  return PRIVACY_GATE_STEPS[idx + 1]!;
}

export function parsePrivacyConsent(raw: string | null): PrivacyConsentRecord | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<PrivacyConsentRecord>;
    if (data.version !== 1) return null;
    if (!data.preferences || typeof data.preferences !== "object") return null;
    if (typeof data.humanApprovedAt !== "string") return null;
    if (typeof data.intentConfidence !== "number") return null;
    if (typeof data.savedAt !== "string") return null;
    return {
      version: 1,
      preferences: {
        functional: Boolean(data.preferences.functional ?? true),
        performance: Boolean(data.preferences.performance),
        targeting: Boolean(data.preferences.targeting),
      },
      humanApprovedAt: data.humanApprovedAt,
      intentConfidence: data.intentConfidence,
      savedAt: data.savedAt,
      coreCommand: HAI_CORE_COMMAND,
    };
  } catch {
    return null;
  }
}

export function readPrivacyConsent(): PrivacyConsentRecord | null {
  if (typeof window === "undefined") return null;
  return parsePrivacyConsent(window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY));
}

export function writePrivacyConsent(record: PrivacyConsentRecord): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event("hai-privacy-consent"));
}

export function buildPrivacyConsentRecord(input: {
  preferences: CookiePreferences;
  humanApprovedAt: string;
  intentConfidence: number;
}): PrivacyConsentRecord {
  return {
    version: 1,
    preferences: {
      ...input.preferences,
      // Essential / functional cookies remain on after a completed choice.
      functional: true,
    },
    humanApprovedAt: input.humanApprovedAt,
    intentConfidence: input.intentConfidence,
    savedAt: new Date().toISOString(),
    coreCommand: HAI_CORE_COMMAND,
  };
}
