"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT, type Dict, type Lang } from "./i18n";

export const LANG_KEY = "qitaf-lang";

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "en", t: DICT.en, setLang: () => {},
});
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Read the saved choice after the first render, so the server HTML and the first client render match.
  useEffect(() => {
    try {
      if (localStorage.getItem(LANG_KEY) === "ar") setLangState("ar");
    } catch {
      /* storage can be blocked; stay in English */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage can be blocked; the language still applies for this visit */
    }
  }, []);

  const value = useMemo(() => ({ lang, t: DICT[lang], setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
