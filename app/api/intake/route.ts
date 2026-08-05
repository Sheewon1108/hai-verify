import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";

export const runtime = "nodejs";

type IntakeTier = "starter" | "trust_pilot" | "compliance_pilot";

type IntakeRecord = {
  intakeId: string;
  tier: IntakeTier;
  contact: {
    name: string;
    email: string;
    company: string;
    role: string;
  };
  useCase: string;
  sampleText: string;
  referral: string;
  status: "received";
  timestamp: string;
};

const DATA_DIR = path.join(process.cwd(), "mock-data");
const DATA_FILE = path.join(DATA_DIR, "intake.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isTier(value: string): value is IntakeTier {
  return value === "starter" || value === "trust_pilot" || value === "compliance_pilot";
}

function createIntakeId(): string {
  return `INT-${Date.now().toString(36).toUpperCase()}`;
}

async function readExistingRecords(): Promise<IntakeRecord[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as IntakeRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function appendRecord(record: IntakeRecord): Promise<void> {
  const existing = await readExistingRecords();
  existing.push(record);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(existing, null, 2));
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/intake",
      method: "POST",
      mode: "mock",
      description: "Capture paid HAI sales intake after Stripe payment.",
      body: {
        tier: "starter | trust_pilot | compliance_pilot",
        contact: {
          name: "string",
          email: "string",
          company: "string (optional)",
          role: "string (optional)",
        },
        useCase: "string (min 20 chars)",
        sampleText: "string (optional, max 2000 chars)",
        referral: "string (optional)",
        honeypot: "string (must be empty)",
      },
    },
    { requestOrigin: request.headers.get("origin") },
  );
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin },
    );
  }

  const record = body as Record<string, unknown>;
  const tier = asString(record.tier);
  const contact = (record.contact ?? {}) as Record<string, unknown>;
  const name = asString(contact.name);
  const email = asString(contact.email);
  const company = asString(contact.company);
  const role = asString(contact.role);
  const useCase = asString(record.useCase);
  const sampleText = asString(record.sampleText);
  const referral = asString(record.referral) || "payment-success";
  const honeypot = asString(record.honeypot);

  if (!isTier(tier)) {
    return jsonWithCors(
      { ok: false, error: "Field 'tier' must be starter, trust_pilot, or compliance_pilot" },
      { status: 400, requestOrigin },
    );
  }

  if (!name) {
    return jsonWithCors(
      { ok: false, error: "Field 'contact.name' is required" },
      { status: 400, requestOrigin },
    );
  }

  if (!email || !EMAIL_RE.test(email)) {
    return jsonWithCors(
      { ok: false, error: "Valid 'contact.email' is required" },
      { status: 400, requestOrigin },
    );
  }

  if (useCase.length < 20) {
    return jsonWithCors(
      { ok: false, error: "Field 'useCase' must be at least 20 characters" },
      { status: 400, requestOrigin },
    );
  }

  if (sampleText.length > 2000) {
    return jsonWithCors(
      { ok: false, error: "Field 'sampleText' must be 2000 characters or less" },
      { status: 400, requestOrigin },
    );
  }

  if (honeypot) {
    return jsonWithCors(
      { ok: false, error: "Spam check failed" },
      { status: 400, requestOrigin },
    );
  }

  const timestamp = new Date().toISOString();
  const intakeId = createIntakeId();
  const intakeRecord: IntakeRecord = {
    intakeId,
    tier,
    contact: {
      name,
      email,
      company,
      role,
    },
    useCase,
    sampleText,
    referral,
    status: "received",
    timestamp,
  };

  try {
    await appendRecord(intakeRecord);
  } catch {
    return jsonWithCors(
      { ok: false, error: "Unable to record intake" },
      { status: 500, requestOrigin },
    );
  }

  return jsonWithCors(
    {
      ok: true,
      mode: "mock",
      intakeId,
      tier,
      status: "received",
      nextSteps: [
        "Mock: intake recorded locally.",
        "Human follow-up can begin from the stored intake record.",
        "Stripe success should redirect here before intake.",
      ],
      mockVerification: null,
      timestamp,
    },
    { status: 201, requestOrigin },
  );
}
