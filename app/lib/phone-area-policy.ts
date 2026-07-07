/** US area code hints — contact metadata only, never timezone or residence. */

export const PHONE_AREA_POLICY_EN =
  "A US phone area code (e.g. 212 Eastern) does not determine where you live or which timezone tools should use.";

export const PHONE_AREA_POLICY_KO =
  "미국 전화 지역번호(예: 212 동부)만으로 거주지나 도구가 쓸 시간대를 정하면 안 됩니다.";

/** Sample of major US area codes → typical zone hint (for abuse detection only, not enforcement). */
export const US_AREA_CODE_ZONE_HINTS: ReadonlyArray<{
  codes: readonly string[];
  label: string;
  timezone: string;
}> = [
  { codes: ["212", "646", "917", "617", "718", "202", "305"], label: "US Eastern (sample)", timezone: "Eastern Standard Time" },
  { codes: ["312", "214", "713", "512"], label: "US Central (sample)", timezone: "Central Standard Time" },
  { codes: ["303", "602", "505"], label: "US Mountain (sample)", timezone: "Mountain Standard Time" },
  { codes: ["213", "310", "415", "206", "503"], label: "US Pacific (sample)", timezone: "Pacific Standard Time" },
];

export function parseUsAreaCode(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1, 4);
  if (digits.length === 10) return digits.slice(0, 3);
  return null;
}

export function areaCodeZoneHint(phone: string): { label: string; timezone: string } | null {
  const code = parseUsAreaCode(phone);
  if (!code) return null;
  for (const entry of US_AREA_CODE_ZONE_HINTS) {
    if (entry.codes.includes(code)) return { label: entry.label, timezone: entry.timezone };
  }
  return null;
}