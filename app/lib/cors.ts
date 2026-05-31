// Copyright 2026 KARAM. All Rights Reserved.

/** CORS — open for Grok, ChatGPT, Gemini, and other AI clients (MVP). */
export const CORS_ALLOW_ORIGINS = [
  "https://x.ai",
  "https://grok.x.ai",
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://gemini.google.com",
  "https://aistudio.google.com",
  "https://cursor.com",
  "https://www.cursor.com",
] as const;

export function corsHeaders(requestOrigin: string | null): HeadersInit {
  const allowOrigin =
    requestOrigin &&
    (CORS_ALLOW_ORIGINS.includes(requestOrigin as (typeof CORS_ALLOW_ORIGINS)[number]) ||
      requestOrigin.startsWith("http://localhost:") ||
      requestOrigin.startsWith("http://127.0.0.1:"))
      ? requestOrigin
      : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Accept-Language, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

export function jsonWithCors(
  body: unknown,
  init: ResponseInit & { requestOrigin?: string | null } = {},
): Response {
  const { requestOrigin = null, headers, ...rest } = init;
  return Response.json(body, {
    ...rest,
    headers: {
      ...corsHeaders(requestOrigin),
      ...(headers ?? {}),
    },
  });
}
