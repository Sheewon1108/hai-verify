import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 12_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type IntakePayload = {
  name: string;
  email: string;
  companyOrProject: string;
  workflowToEvaluate: string;
  expectedResult: string;
  relevantUrl: string;
  additionalContext: string;
};

type FieldOptions = {
  label: string;
  required?: boolean;
  maxLength: number;
  multiline?: boolean;
};

function json(body: { ok: boolean; error?: string; message?: string }, status = 200) {
  return NextResponse.json(body, { status });
}

function normalizeText(value: string, multiline: boolean): string {
  const withoutControls = value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  if (multiline) {
    return withoutControls
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return withoutControls.replace(/\s+/g, " ").trim();
}

function sanitizeField(value: unknown, options: FieldOptions): { value: string; error?: string } {
  if (typeof value !== "string") {
    if (options.required) {
      return { value: "", error: `${options.label} is required.` };
    }
    return { value: "" };
  }

  const normalized = normalizeText(value, Boolean(options.multiline));

  if (options.required && !normalized) {
    return { value: "", error: `${options.label} is required.` };
  }

  if (normalized.length > options.maxLength) {
    return {
      value: "",
      error: `${options.label} must be ${options.maxLength} characters or fewer.`,
    };
  }

  return { value: normalized };
}

function validateUrl(url: string): boolean {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function sendIntakeEmail(payload: IntakePayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const operationsEmail = process.env.HAI_OPERATIONS_EMAIL?.trim();

  if (!apiKey || !operationsEmail) {
    return { ok: false, error: "Intake delivery is not configured." as const, status: 503 };
  }

  const fromEmail = process.env.HAI_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [operationsEmail],
      reply_to: payload.email,
      subject: `HAI Evaluation Intake — ${payload.companyOrProject}`,
      text: [
        "New HAI evaluation intake",
        "",
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Company or project: ${payload.companyOrProject}`,
        "",
        "AI command, workflow, or execution to evaluate:",
        payload.workflowToEvaluate,
        "",
        "Expected result:",
        payload.expectedResult,
        "",
        `Relevant URL: ${payload.relevantUrl || "(not provided)"}`,
        "",
        "Additional context:",
        payload.additionalContext || "(not provided)",
      ].join("\n"),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[intake] resend delivery failed", response.status);
    return { ok: false, error: "Unable to deliver the intake request right now." as const, status: 502 };
  }

  return { ok: true, status: 200 as const };
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Request body is too large." }, 413);
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  if (!rawBody) {
    return json({ ok: false, error: "Request body is required." }, 400);
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Request body is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const record = body as Record<string, unknown>;

  const name = sanitizeField(record.name, {
    label: "Name",
    required: true,
    maxLength: 100,
  });
  if (name.error) return json({ ok: false, error: name.error }, 400);

  const email = sanitizeField(record.email, {
    label: "Email",
    required: true,
    maxLength: 254,
  });
  if (email.error) return json({ ok: false, error: email.error }, 400);
  if (!EMAIL_RE.test(email.value)) {
    return json({ ok: false, error: "Email must be a valid email address." }, 400);
  }

  const companyOrProject = sanitizeField(record.companyOrProject, {
    label: "Company or project",
    required: true,
    maxLength: 160,
  });
  if (companyOrProject.error) return json({ ok: false, error: companyOrProject.error }, 400);

  const workflowToEvaluate = sanitizeField(record.workflowToEvaluate, {
    label: "AI command, workflow, or execution to evaluate",
    required: true,
    maxLength: 2000,
    multiline: true,
  });
  if (workflowToEvaluate.error) {
    return json({ ok: false, error: workflowToEvaluate.error }, 400);
  }

  const expectedResult = sanitizeField(record.expectedResult, {
    label: "Expected result",
    required: true,
    maxLength: 1600,
    multiline: true,
  });
  if (expectedResult.error) return json({ ok: false, error: expectedResult.error }, 400);

  const relevantUrl = sanitizeField(record.relevantUrl, {
    label: "Relevant URL",
    maxLength: 500,
  });
  if (relevantUrl.error) return json({ ok: false, error: relevantUrl.error }, 400);
  if (!validateUrl(relevantUrl.value)) {
    return json({ ok: false, error: "Relevant URL must be a valid http or https URL." }, 400);
  }

  const additionalContext = sanitizeField(record.additionalContext, {
    label: "Additional context",
    maxLength: 2000,
    multiline: true,
  });
  if (additionalContext.error) return json({ ok: false, error: additionalContext.error }, 400);

  const emailResult = await sendIntakeEmail({
    name: name.value,
    email: email.value,
    companyOrProject: companyOrProject.value,
    workflowToEvaluate: workflowToEvaluate.value,
    expectedResult: expectedResult.value,
    relevantUrl: relevantUrl.value,
    additionalContext: additionalContext.value,
  });

  if (!emailResult.ok) {
    return json({ ok: false, error: emailResult.error }, emailResult.status);
  }

  return json({
    ok: true,
    message:
      "Evaluation request received. HAI will review the submitted execution flow and contact you using the email provided.",
  });
}
