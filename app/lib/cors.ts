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

export function isAllowedCorsOrigin(requestOrigin: string | null): boolean {
  if (!requestOrigin) return false;
  return (
    CORS_ALLOW_ORIGINS.includes(requestOrigin as (typeof CORS_ALLOW_ORIGINS)[number]) ||
    requestOrigin.startsWith("http://localhost:") ||
    requestOrigin.startsWith("http://127.0.0.1:")
  );
}

export function corsHeaders(requestOrigin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Accept-Language, Authorization, X-Requested-With, X-HAI-API-Key, X-HAI-CSRF",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (isAllowedCorsOrigin(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin as string;
  }

  return headers;
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
