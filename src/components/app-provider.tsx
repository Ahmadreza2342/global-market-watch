"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { translations, type Lang, type Dict } from "@/lib/i18n";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: Dict;
  isRtl: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fa";
    return (localStorage.getItem("gmw_lang") as Lang) || "fa";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("gmw_theme") as "light" | "dark") || "dark";
  });

  // Apply theme to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gmw_theme", theme);
  }, [theme]);

  // Apply lang + dir to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    localStorage.setItem("gmw_lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleTheme = useCallback(() => setTheme((p) => (p === "dark" ? "light" : "dark")), []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      theme,
      toggleTheme,
      t: translations[lang],
      isRtl: lang === "fa",
    }),
    [lang, setLang, theme, toggleTheme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
