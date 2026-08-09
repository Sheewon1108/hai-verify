"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { analyzeIntent, type HaiIcResult } from "@/app/lib/hai-ic-analyze";
import { HAI_CORE_COMMAND } from "@/app/lib/hai-ruleset";
import {
  DEFAULT_COOKIE_PREFERENCES,
  buildPrivacyConsentRecord,
  canEnterCookieChoice,
  nextPrivacyGateStep,
  readPrivacyConsent,
  writePrivacyConsent,
  type CookiePreferences,
  type PrivacyConsentRecord,
  type PrivacyGateStep,
} from "@/app/lib/privacy-consent";

const INTENT_PLACEHOLDER =
  "I intend to review cookie preferences (Functional, Performance, Targeting) and take responsibility for my privacy choices on this site.";

type GatePhase = PrivacyGateStep | "ready";

function splitCoreCommand(command: string): [string, string] {
  const marker = ", ";
  const idx = command.indexOf(marker);
  if (idx < 0) return [command, ""];
  return [command.slice(0, idx + 1), command.slice(idx + marker.length)];
}

function subscribePrivacyConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("hai-privacy-consent", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("hai-privacy-consent", handler);
  };
}

function getPrivacyConsentSnapshot(): PrivacyConsentRecord | null {
  return readPrivacyConsent();
}

function getPrivacyConsentServerSnapshot(): null {
  return null;
}

export function PrivacyConsentGate() {
  const storedConsent = useSyncExternalStore(
    subscribePrivacyConsent,
    getPrivacyConsentSnapshot,
    getPrivacyConsentServerSnapshot,
  );

  const [phase, setPhase] = useState<GatePhase>("core-command");
  const [coreCommandAcknowledged, setCoreCommandAcknowledged] = useState(false);
  const [intentInput, setIntentInput] = useState(INTENT_PLACEHOLDER);
  const [intentResult, setIntentResult] = useState<HaiIcResult | null>(null);
  const [humanApproved, setHumanApproved] = useState(false);
  const [humanApprovedAt, setHumanApprovedAt] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(
    () => storedConsent?.preferences ?? DEFAULT_COOKIE_PREFERENCES,
  );

  const [coreLead, coreTail] = useMemo(
    () => splitCoreCommand(HAI_CORE_COMMAND),
    [],
  );

  const intentMeasured = intentResult !== null;

  const mayEnterChoice = canEnterCookieChoice({
    coreCommandAcknowledged,
    intentMeasured,
    humanApproved,
  });

  const confidenceColor = useMemo(() => {
    if (!intentResult) return "text-foreground";
    if (intentResult.confidence >= 75) return "text-emerald-400";
    if (intentResult.confidence >= 60) return "text-amber-400";
    return "text-red-accent";
  }, [intentResult]);

  // Already completed choice — do not show the gate again.
  if (storedConsent || phase === "ready") {
    return null;
  }

  const goNextFrom = (current: PrivacyGateStep) => {
    const next = nextPrivacyGateStep(current);
    if (next) setPhase(next);
  };

  const runIntentMeasure = () => {
    if (!intentInput.trim()) return;
    setIntentResult(analyzeIntent(intentInput));
  };

  const approveAndContinue = () => {
    if (!intentMeasured || !coreCommandAcknowledged) return;
    const at = new Date().toISOString();
    setHumanApproved(true);
    setHumanApprovedAt(at);
    if (
      canEnterCookieChoice({
        coreCommandAcknowledged: true,
        intentMeasured: true,
        humanApproved: true,
      })
    ) {
      setPhase("cookie-choice");
    }
  };

  const savePreferences = () => {
    if (!mayEnterChoice || !humanApprovedAt || !intentResult) return;
    const record = buildPrivacyConsentRecord({
      preferences,
      humanApprovedAt,
      intentConfidence: intentResult.confidence,
    });
    writePrivacyConsent(record);
    setPhase("ready");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0d18]/92 backdrop-blur-md px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-gate-title"
      data-privacy-gate={phase}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,0,51,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(30,30,60,0.9),_#0d0d18)]" />

      <div className="relative w-full max-w-xl animate-fade-in-up rounded-3xl border border-white/10 bg-surface/95 p-6 shadow-2xl sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-red-accent">
          Privacy policy choice · required gate
        </p>

        {phase === "core-command" && (
          <div className="mt-6">
            <h2
              id="privacy-gate-title"
              className="text-2xl font-black tracking-[-0.03em] leading-snug text-white sm:text-3xl"
            >
              {coreLead}
              <br />
              <span className="bg-gradient-to-r from-[#ff0033] via-[#ff1a4d] to-[#ff6699] bg-clip-text text-transparent">
                {coreTail}
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Cookie preferences (Functional / Performance / Targeting) open only
              after Intent Confidence is measured and a human approves.
            </p>
            <button
              type="button"
              className="mt-8 w-full rounded-2xl bg-red-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
              onClick={() => {
                setCoreCommandAcknowledged(true);
                goNextFrom("core-command");
              }}
            >
              Continue to Intent Confidence
            </button>
          </div>
        )}

        {phase === "intent-measure" && (
          <div className="mt-6">
            <h2
              id="privacy-gate-title"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              Measure Intent Confidence
            </h2>
            <p className="mt-2 text-sm text-muted">
              State why you are setting privacy preferences. Hai-ic scores intent
              before any cookie choice.
            </p>
            <textarea
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  runIntentMeasure();
                }
              }}
              rows={5}
              className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-background px-4 py-3 text-sm outline-none focus:border-red-accent"
              aria-label="Intent for privacy preferences"
            />
            <button
              type="button"
              disabled={!intentInput.trim()}
              onClick={runIntentMeasure}
              className="mt-4 w-full rounded-2xl bg-red-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Measure Intent Confidence
            </button>

            {intentResult && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-background p-4 animate-fade-in">
                <div className="flex items-end gap-3">
                  <p className={`text-4xl font-bold tabular-nums ${confidenceColor}`}>
                    {intentResult.confidence}%
                  </p>
                  <div>
                    <p className="text-sm font-semibold">{intentResult.mode}</p>
                    <p className="text-xs text-muted">Intent Confidence</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full transition-all duration-500 ${
                      intentResult.sincereMode ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${intentResult.confidence}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="mt-5 w-full rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white transition hover:border-red-accent hover:bg-red-accent/10"
                  onClick={() => goNextFrom("intent-measure")}
                >
                  Review human approval
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "human-approve" && (
          <div className="mt-6">
            <h2
              id="privacy-gate-title"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              Human approval required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              AI does not choose cookies for you. Confirm that you measured intent
              and accept final responsibility before the choice screen.
            </p>

            {intentResult ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-background px-4 py-3 text-sm">
                <p className="text-muted">Measured Intent Confidence</p>
                <p className={`text-2xl font-bold tabular-nums ${confidenceColor}`}>
                  {intentResult.confidence}%
                </p>
                <p className="mt-1 text-xs text-muted">{HAI_CORE_COMMAND}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-300">
                Intent Confidence has not been measured yet.
              </p>
            )}

            <button
              type="button"
              disabled={!intentMeasured || !coreCommandAcknowledged}
              onClick={approveAndContinue}
              className="mt-6 w-full rounded-2xl bg-red-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              I approve — open cookie choices
            </button>
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-white/10 py-2.5 text-xs text-muted transition hover:text-foreground"
              onClick={() => setPhase("intent-measure")}
            >
              Re-measure intent
            </button>
          </div>
        )}

        {phase === "cookie-choice" && mayEnterChoice && (
          <div className="mt-6">
            <h2
              id="privacy-gate-title"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              Cookie preferences
            </h2>
            <p className="mt-2 text-sm text-muted">
              Choose Functional, Performance, and Targeting after human approval.
            </p>

            <ul className="mt-6 space-y-3">
              {(
                [
                  {
                    key: "functional" as const,
                    label: "Functional",
                    description: "Essential site operation. Always on.",
                    locked: true,
                  },
                  {
                    key: "performance" as const,
                    label: "Performance",
                    description: "Helps measure reliability and load quality.",
                    locked: false,
                  },
                  {
                    key: "targeting" as const,
                    label: "Targeting",
                    description: "Optional personalization and outreach signals.",
                    locked: false,
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center pt-0.5">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={preferences[item.key]}
                      disabled={item.locked}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                    />
                    <span className="h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-red-accent peer-disabled:opacity-70 after:absolute after:left-0.5 after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                    <span className="sr-only">{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={savePreferences}
              className="mt-7 w-full rounded-2xl bg-red-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Save privacy choices
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
