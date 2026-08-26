// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

const XAI_URL = "https://api.x.ai/v1/chat/completions";

function runtimeEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function grokModel(): string {
  return runtimeEnv("XAI_MODEL") || "grok-3";
}

export async function summarizeReplyWithGrok(input: {
  company: string;
  from: string;
  subject: string;
  body: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = runtimeEnv("XAI_API_KEY") || runtimeEnv("GROK_API_KEY");
  if (!key) {
    return { ok: false, error: "XAI_API_KEY unset" };
  }

  const body = input.body.trim().slice(0, 800);
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: grokModel(),
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You write for KARAM SHIN. Korean only. Max 4 short lines. No English dump. No secrets. No hype. Say who replied, what they want, and the one next step (open Gmail / book 30-min demo). If unclear, say 내용 불명확.",
        },
        {
          role: "user",
          content: `회사: ${input.company}\n보낸 사람: ${input.from}\n제목: ${input.subject || "(제목 없음)"}\n본문:\n${body || "(본문 없음)"}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, error: `xAI ${res.status}: ${errText.slice(0, 160)}` };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: "Grok returned empty text" };
  return { ok: true, text };
}
