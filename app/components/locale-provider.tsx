"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getSiteCopy, type UiCopy } from "../lib/site-copy";
import {
  type AppLocale,
  getOrderCopy,
  isAppLocale,
  type OrderCopy,
} from "../lib/ui-locale";

const STORAGE_KEY = "hai-ui-locale";

export type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  order: OrderCopy;
  t: UiCopy;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const localeListeners = new Set<() => void>();

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isAppLocale(stored) ? stored : "en";
}

function subscribeLocale(onStoreChange: () => void) {
  localeListeners.add(onStoreChange);
  return () => {
    localeListeners.delete(onStoreChange);
  };
}

function emitLocaleChange() {
  localeListeners.forEach((listener) => listener());
}

function getLocaleSnapshot(): AppLocale {
  return readStoredLocale();
}

function getServerLocaleSnapshot(): AppLocale {
  return "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const setLocale = useCallback((next: AppLocale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    emitLocaleChange();
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      order: getOrderCopy(locale),
      t: getSiteCopy(locale),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
