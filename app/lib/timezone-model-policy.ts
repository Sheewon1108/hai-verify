/**
 * Global user-context timezone model.
 * - multi: inferring WHICH zone from language/phone/locale is FORBIDDEN worldwide
 * - single: one national zone (zone pick N/A); location-from-language still FORBIDDEN
 * - unknown: default to multi (safe)
 */

export type TimezoneModel = "single" | "multi";

export const TIMEZONE_MODEL_POLICY_EN =
  "Worldwide: in any multi-timezone country, never infer which zone from language, phone, or locale. In single-timezone countries, one national zone — but language still does not prove residence.";

export const TIMEZONE_MODEL_POLICY_KO =
  "전 세계: 복수 시간대 국가에서는 언어·전화·로케일로 시간대 추론 금지. 단일 시간대 국가는 전국이 같지만, 언어만으로 거주지 추론 금지.";

/** Multi-timezone countries — zone inference always FORBIDDEN. */
export const MULTI_TIMEZONE_COUNTRIES: ReadonlyArray<{
  countryPattern: RegExp;
  label: string;
  zoneCount: number;
  zones: readonly string[];
}> = [
  { countryPattern: /\bRussia\b|RU\b|Moscow|Siberia/i, label: "Russia", zoneCount: 11, zones: ["Kaliningrad", "Moscow", "Samara", "Yekaterinburg", "Omsk", "Krasnoyarsk", "Irkutsk", "Yakutsk", "Vladivostok", "Magadan", "Kamchatka"] },
  { countryPattern: /\bUS\b|United States|America|California|Texas|New York|Alaska|Hawaii/i, label: "United States", zoneCount: 6, zones: ["Pacific", "Mountain", "Central", "Eastern", "Alaska", "Hawaii"] },
  { countryPattern: /\bCanada\b|\bCA\b|Ontario|Toronto|British Columbia|Vancouver|Quebec|Newfoundland/i, label: "Canada", zoneCount: 6, zones: ["Pacific", "Mountain", "Central", "Eastern", "Atlantic", "Newfoundland"] },
  { countryPattern: /\bMexico\b|MX\b|Ciudad de Mexico/i, label: "Mexico", zoneCount: 4, zones: ["Pacific", "Mountain", "Central", "Eastern"] },
  { countryPattern: /\bAustralia\b|AU\b|Sydney|Perth/i, label: "Australia", zoneCount: 3, zones: ["Western", "Central", "Eastern"] },
  { countryPattern: /\bBrazil\b|BR\b|Sao Paulo|Amazonas/i, label: "Brazil", zoneCount: 3, zones: ["Brasilia", "Amazon", "Fernando de Noronha"] },
  { countryPattern: /\bIndonesia\b|ID\b|Jakarta|Bali/i, label: "Indonesia", zoneCount: 3, zones: ["WIB", "WITA", "WIT"] },
  { countryPattern: /\bChile\b|CL\b|Santiago/i, label: "Chile", zoneCount: 2, zones: ["Continental", "Easter Island"] },
  { countryPattern: /\bNew Zealand\b|NZ\b|Auckland/i, label: "New Zealand", zoneCount: 2, zones: ["NZST", "Chatham"] },
  { countryPattern: /\bKiribati\b|KI\b/i, label: "Kiribati", zoneCount: 3, zones: ["Gilbert", "Phoenix", "Line"] },
  { countryPattern: /\bAntarctica\b/i, label: "Antarctica", zoneCount: 9, zones: ["multiple research stations"] },
];

/** Single national timezone — zone ambiguity N/A domestically. */
export const SINGLE_TIMEZONE_COUNTRIES: ReadonlyArray<{
  countryPattern: RegExp;
  label: string;
  timezone: string;
}> = [
  { countryPattern: /Korea|South Korea|Seoul|KR\b/i, label: "Korea", timezone: "Korea Standard Time" },
  { countryPattern: /\bJapan\b|Tokyo|JP\b/i, label: "Japan", timezone: "Tokyo Standard Time" },
  { countryPattern: /\bChina\b|Beijing|CN\b/i, label: "China", timezone: "China Standard Time" },
  { countryPattern: /\bIndia\b|IN\b|Delhi|Mumbai/i, label: "India", timezone: "India Standard Time" },
  { countryPattern: /\bIceland\b|IS\b|Reykjavik/i, label: "Iceland", timezone: "Greenwich Standard Time" },
  { countryPattern: /\bSaudi Arabia\b|SA\b|Riyadh/i, label: "Saudi Arabia", timezone: "Arab Standard Time" },
  { countryPattern: /\bSingapore\b|SG\b/i, label: "Singapore", timezone: "Singapore Standard Time" },
  { countryPattern: /\bTaiwan\b|TW\b|Taipei/i, label: "Taiwan", timezone: "Taipei Standard Time" },
  { countryPattern: /\bVietnam\b|VN\b|Hanoi/i, label: "Vietnam", timezone: "SE Asia Standard Time" },
  { countryPattern: /\bThailand\b|TH\b|Bangkok/i, label: "Thailand", timezone: "SE Asia Standard Time" },
  { countryPattern: /\bPhilippines\b|PH\b|Manila/i, label: "Philippines", timezone: "Singapore Standard Time" },
];

export function resolveTimezoneModel(region: string, country?: string | null): TimezoneModel {
  const haystack = `${region} ${country ?? ""}`;
  for (const entry of MULTI_TIMEZONE_COUNTRIES) {
    if (entry.countryPattern.test(haystack)) return "multi";
  }
  for (const entry of SINGLE_TIMEZONE_COUNTRIES) {
    if (entry.countryPattern.test(haystack)) return "single";
  }
  return "multi";
}

export function inferenceRuleForModel(model: TimezoneModel): string {
  if (model === "multi") {
    return "Zone inference FORBIDDEN — use USER_TIMEZONE only";
  }
  return "One national zone — zone inference N/A, but location-from-language still FORBIDDEN";
}

export function listMultiTimezoneCountries(): readonly string[] {
  return MULTI_TIMEZONE_COUNTRIES.map((c) => c.label);
}