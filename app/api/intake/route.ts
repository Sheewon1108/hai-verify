import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_BYTES = 32_000;

const REQUIRED_FIELDS = ['name', 'email', 'company', 'execution', 'expectedResult'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

const FIELD_LIMITS: Record<string, number> = {
  name: 120,
  email: 254,
  company: 160,
  execution: 4000,
  expectedResult: 2000,
  relevantUrl: 500,
  context: 2000,
};

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, 8000);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Request body too large.' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'Request body too large.' }, { status: 413 });
    }
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const fields: Record<string, string> = {};
  for (const key of Object.keys(FIELD_LIMITS)) {
    fields[key] = sanitize(body[key]);
  }

  const missing = REQUIRED_FIELDS.filter(
    (f: RequiredField) => !fields[f],
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing required fields: ${missing.join(', ')}.` },
      { status: 422 },
    );
  }

  for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
    if (fields[key] && fields[key].length > limit) {
      return NextResponse.json(
        { ok: false, error: `Field "${key}" exceeds maximum length of ${limit} characters.` },
        { status: 422 },
      );
    }
  }

  if (!isValidEmail(fields.email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email address.' }, { status: 422 });
  }

  const opsEmail = process.env.HAI_OPERATIONS_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (opsEmail && resendKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const emailBody = [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Company / Project: ${fields.company}`,
        ``,
        `AI Execution to Evaluate:`,
        fields.execution,
        ``,
        `Expected Result:`,
        fields.expectedResult,
        fields.relevantUrl ? `\nRelevant URL: ${fields.relevantUrl}` : '',
        fields.context ? `\nAdditional Context:\n${fields.context}` : '',
      ]
        .filter((l) => l !== undefined)
        .join('\n');

      await resend.emails.send({
        from: 'HAI Intake <intake@hai-ic.com>',
        to: opsEmail,
        replyTo: fields.email,
        subject: `[HAI Intake] ${fields.name} — ${fields.company}`,
        text: emailBody,
      });
    } catch {
      // Email delivery failure is non-fatal — submission is still recorded.
      // Do not surface internal error details to the client.
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed.' }, { status: 405 });
}
