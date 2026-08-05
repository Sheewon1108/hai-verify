import { NextResponse } from "next/server";

type IntakeRecord = {
  name: string;
  email: string;
  companyOrProject: string;
  evaluationTarget: string;
  expectedResult: string;
  relevantUrl?: string;
  additionalContext?: string;
};

const MAX_BODY_CHARS = 12_000;
const MAX_FIELD_LENGTH = 2_000;
const MAX_SHORT_FIELD_LENGTH = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeText(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized.slice(0, maxLength);
}

function sanitizeUrl(value: unknown): string {
  const text = sanitizeText(value, MAX_SHORT_FIELD_LENGTH);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toIntakeRecord(payload: unknown): { data?: IntakeRecord; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Invalid request body." };
  }

  const record = payload as Record<string, unknown>;
  const data: IntakeRecord = {
    name: sanitizeText(record.name, MAX_SHORT_FIELD_LENGTH),
    email: sanitizeText(record.email, MAX_SHORT_FIELD_LENGTH).toLowerCase(),
    companyOrProject: sanitizeText(record.companyOrProject, MAX_SHORT_FIELD_LENGTH),
    evaluationTarget: sanitizeText(record.evaluationTarget),
    expectedResult: sanitizeText(record.expectedResult),
    relevantUrl: sanitizeUrl(record.relevantUrl),
    additionalContext: sanitizeText(record.additionalContext),
  };

  if (
    !data.name ||
    !data.email ||
    !data.companyOrProject ||
    !data.evaluationTarget ||
    !data.expectedResult
  ) {
    return { error: "Missing required fields." };
  }

  if (!EMAIL_RE.test(data.email)) {
    return { error: "Invalid email address." };
  }

  return { data };
}

async function sendOperationsEmail(data: IntakeRecord) {
  const resendKey = process.env.RESEND_API_KEY;
  const operationsEmail = process.env.HAI_OPERATIONS_EMAIL;
  const fromEmail = process.env.HAI_FROM_EMAIL ?? "HAI Intake <onboarding@resend.dev>";

  if (!resendKey || !operationsEmail) {
    return { ok: false as const, error: "Intake delivery is not configured." };
  }

  const lines = [
    "New HAI evaluation intake submission",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company or project: ${data.companyOrProject}`,
    "",
    "AI command, workflow, or execution to evaluate:",
    data.evaluationTarget,
    "",
    "Expected result:",
    data.expectedResult,
    "",
    `Relevant URL: ${data.relevantUrl || "(none provided)"}`,
    "",
    "Additional context:",
    data.additionalContext || "(none provided)",
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [operationsEmail],
      reply_to: data.email,
      subject: "HAI Evaluation Intake Submission",
      text: lines.join("\n"),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: "Could not deliver intake notification." };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!bodyText || bodyText.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { ok: false, error: "Request body is missing or too large." },
      { status: 413 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON payload." }, { status: 400 });
  }

  const parsed = toIntakeRecord(payload);
  if (!parsed.data) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const delivery = await sendOperationsEmail(parsed.data);
  if (!delivery.ok) {
    return NextResponse.json({ ok: false, error: delivery.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Evaluation request received." });
}
