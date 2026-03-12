"use client";

import * as React from "react";

type Locale = "en" | "ar";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: "ltr" | "rtl";
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "it-support-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "ar" || stored === "en") setLocaleState(stored);
    setMounted(true);
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "ar" ? "ar" : "en";
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
      localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale, mounted]);

  const value: LocaleContextValue = {
    locale,
    setLocale,
    dir: locale === "ar" ? "rtl" : "ltr",
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) return { locale: "en" as const, setLocale: () => {}, dir: "ltr" as const };
  return ctx;
}
