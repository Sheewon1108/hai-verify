"use client";

import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from "../lib/ui-locale";
import { useLocale } from "./locale-provider";

export function LangPicker({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`flex items-center gap-1 text-[10px] tracking-wide ${className}`}
      role="group"
      aria-label="Language"
    >
      {APP_LOCALES.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 ? (
            <span className="select-none text-white/12" aria-hidden>
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            aria-label={LOCALE_LABELS[code]}
            className={`transition-colors ${
              locale === code
                ? "text-white/90"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {LOCALE_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
