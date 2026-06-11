"use client";

import { useEffect } from "react";

export function DocumentLanguage({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousDir = document.documentElement.dir;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    return () => {
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
    };
  }, [dir, lang]);

  return null;
}
