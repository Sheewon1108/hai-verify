// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

const PLACEHOLDER_FROM_RE = /yourdomain\.com/i;
const ONBOARDING_FROM = "onboarding@resend.dev";

/** Resend sandbox (onboarding@resend.dev) only delivers to the account owner email. */
const DEFAULT_ACCOUNT_EMAIL = "karam@xgoma.com";

/** Bracket access — Next.js must not inline Worker runtime vars at build time. */
function runtimeEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function resolveResendFromEmail(): string {
  const sandboxFrom = `HAI Verify <${ONBOARDING_FROM}>`;
  if (!resendDomainVerified()) return sandboxFrom;
  const env = runtimeEnv("RESEND_FROM_EMAIL");
  if (env && !PLACEHOLDER_FROM_RE.test(env)) return env;
  return sandboxFrom;
}

export function resendAccountOwnerEmail(): string {
  return runtimeEnv("RESEND_ACCOUNT_EMAIL") || DEFAULT_ACCOUNT_EMAIL;
}

export function resendDomainVerified(): boolean {
  return runtimeEnv("RESEND_DOMAIN_VERIFIED")?.toLowerCase() === "true";
}

export function isVerifiedDomainFrom(from: string): boolean {
  if (!resendDomainVerified()) return false;
  const m = from.match(/<([^>]+)>/);
  const addr = (m?.[1] ?? from).trim().toLowerCase();
  return Boolean(addr) && addr !== ONBOARDING_FROM && !addr.endsWith("@resend.dev");
}

/** Preflight before calling Resend — avoids silent webhook success when email cannot send. */
export function canDeliverToRecipient(to: string, from?: string): { ok: true } | { ok: false; reason: string } {
  const resolvedFrom = from ?? resolveResendFromEmail();
  const recipient = to.trim().toLowerCase();

  if (isVerifiedDomainFrom(resolvedFrom)) {
    return { ok: true };
  }

  const owner = resendAccountOwnerEmail().toLowerCase();
  if (recipient === owner) {
    return { ok: true };
  }

  return {
    ok: false,
    reason:
      `Resend sandbox (${ONBOARDING_FROM}) only sends to ${owner}. ` +
      `To deliver to ${recipient}, verify ehacloud.com at https://resend.com/domains ` +
      `and set RESEND_FROM_EMAIL to e.g. HAI Verify <billing@ehacloud.com>.`,
  };
}