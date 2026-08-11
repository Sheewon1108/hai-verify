// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import { API_KEY_PLANS, type ApiKeyPlan } from "@/app/lib/api-keys";
import {
  canDeliverToRecipient,
  resolveResendFromEmail,
} from "@/app/lib/resend-config";

export interface ApiKeyDeliveryPayload {
  email: string;
  plan: ApiKeyPlan;
  apiKey: string;
  sessionId: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ApiKeyDeliveryResult {
  ok: boolean;
  error?: string;
}

/** Send issued API key via Resend. Never log or return the key. */
export async function deliverApiKeyByEmail(
  payload: ApiKeyDeliveryPayload,
): Promise<ApiKeyDeliveryResult> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    const error = "RESEND_API_KEY not set — API key not emailed";
    console.error("[webhook]", error);
    return { ok: false, error };
  }

  const from = resolveResendFromEmail();
  const preflight = canDeliverToRecipient(payload.email, from);
  if (!preflight.ok) {
    console.error("[webhook] email preflight failed:", preflight.reason);
    return { ok: false, error: preflight.reason };
  }
  const planLabel = API_KEY_PLANS[payload.plan]?.label ?? payload.plan;
  const sessionRef = payload.sessionId.slice(0, 14);

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>Your HAI Verify API key for <strong>${escapeHtml(planLabel)}</strong> is ready.</p>
  <p style="font-family:ui-monospace,monospace;font-size:14px;padding:12px;background:#f4f4f5;border-radius:8px;word-break:break-all">${escapeHtml(payload.apiKey)}</p>
  <p>Store this key securely. It will not be shown again.</p>
  <p style="font-size:12px;color:#666">Order reference: ${escapeHtml(sessionRef)}…</p>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.email],
      subject: `Your HAI Verify API Key (${planLabel})`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const error = `Resend ${res.status}: ${errText.slice(0, 200)}`;
    console.error("[webhook] email delivery failed:", error);
    return { ok: false, error };
  }

  return { ok: true };
}