import { useMemo, useState, type ReactNode } from "react";
import { LANG_KEY, LangReactContext, loadStoredLang, type Lang } from "../lib/i18n.js";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadStoredLang);

  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, next);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LangReactContext.Provider value={value}>{children}</LangReactContext.Provider>;
}
