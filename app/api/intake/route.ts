import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 12_000;
const SUCCESS_MESSAGE =
  "Evaluation request received. HAI will review the submitted execution flow and contact you using the email provided.";

const FIELD_LIMITS = {
  name: 120,
  email: 180,
  companyProject: 180,
  executionToEvaluate: 2000,
  expectedResult: 1600,
  relevantUrl: 500,
  additionalContext: 2000,
} as const;

type IntakePayload = {
  name: string;
  email: string;
  companyProject: string;
  executionToEvaluate: string;
  expectedResult: string;
  relevantUrl: string;
  additionalContext: string;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function methodNotAllowed() {
  return jsonError("Method not allowed. Use POST.", 405);
}

function bodyByteLength(input: string): number {
  return new TextEncoder().encode(input).byteLength;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUrl(value: unknown): string {
  const sanitized = sanitizeText(value, FIELD_LIMITS.relevantUrl);
  if (!sanitized) return "";

  try {
    const url = new URL(sanitized);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function parsePayload(body: unknown): IntakePayload {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    name: sanitizeText(record.name, FIELD_LIMITS.name),
    email: sanitizeText(record.email, FIELD_LIMITS.email).toLowerCase(),
    companyProject: sanitizeText(record.companyProject, FIELD_LIMITS.companyProject),
    executionToEvaluate: sanitizeText(
      record.executionToEvaluate,
      FIELD_LIMITS.executionToEvaluate,
    ),
    expectedResult: sanitizeText(record.expectedResult, FIELD_LIMITS.expectedResult),
    relevantUrl: sanitizeUrl(record.relevantUrl),
    additionalContext: sanitizeText(record.additionalContext, FIELD_LIMITS.additionalContext),
  };
}

function validatePayload(payload: IntakePayload): string | null {
  if (!payload.name) return "Name is required.";
  if (!payload.email || !isValidEmail(payload.email)) return "A valid email is required.";
  if (!payload.companyProject) return "Company or project is required.";
  if (!payload.executionToEvaluate) {
    return "AI command, workflow, or execution to evaluate is required.";
  }
  if (!payload.expectedResult) return "Expected result is required.";
  return null;
}

function buildEmailText(payload: IntakePayload): string {
  return [
    "New HAI-IC $300 Evaluation intake",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company or project: ${payload.companyProject}`,
    "",
    "AI command, workflow, or execution to evaluate:",
    payload.executionToEvaluate,
    "",
    "Expected result:",
    payload.expectedResult,
    "",
    "Relevant URL:",
    payload.relevantUrl || "Not provided",
    "",
    "Additional context:",
    payload.additionalContext || "Not provided",
  ].join("\n");
}

async function sendIntakeEmail(payload: IntakePayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const operationsEmail = process.env.HAI_OPERATIONS_EMAIL?.trim();

  if (!apiKey || !operationsEmail) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `HAI-IC Intake <${operationsEmail}>`,
      to: [operationsEmail],
      reply_to: payload.email,
      subject: "New HAI-IC $300 Evaluation intake",
      text: buildEmailText(payload),
    }),
  });

  if (!response.ok) {
    console.error("[intake] Resend delivery failed", { status: response.status });
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return jsonError("Unable to read request body.", 400);
  }

  if (bodyByteLength(rawBody) > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const payload = parsePayload(body);
  const validationError = validatePayload(payload);
  if (validationError) {
    return jsonError(validationError, 400);
  }

  try {
    const delivered = await sendIntakeEmail(payload);
    if (!delivered) {
      return jsonError("Intake email is not configured or could not be delivered.", 503);
    }
  } catch {
    console.error("[intake] delivery exception");
    return jsonError("Intake email could not be delivered.", 502);
  }

  return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
