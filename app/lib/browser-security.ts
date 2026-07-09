import { HAI_CSRF_COOKIE, HAI_CSRF_HEADER } from "@/app/lib/security-constants";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function csrfRequestHeaders(): Record<string, string> {
  const token = readCookie(HAI_CSRF_COOKIE);
  if (!token) return {};
  return { [HAI_CSRF_HEADER]: token };
}
