"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { COOKIE_LANG, type Lang } from "@/lib/i18n";

/** Lee el idioma de la cookie (cliente). Por defecto, español. */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("es");
  useEffect(() => {
    const c = document.cookie.match(/(?:^|; )lang=(es|en)/);
    if (c) setLang(c[1] as Lang);
  }, []);
  return lang;
}

const boton =
  "flex h-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10";

/** Sol / luna en trazo simple, del color del texto (sin emoji). */
export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [listo, setListo] = useState(false);
  useEffect(() => setListo(true), []);
  const dark = resolvedTheme === "dark";
  if (!listo) return <span className="h-9 w-9" aria-hidden />;
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Modo claro" : "Modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`${boton} w-9`}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}

/** ES | EN — guarda la elección en la cookie y recarga para aplicarla. */
export function LangButton() {
  const lang = useLang();
  const cambiar = (a: Lang) => {
    if (a === lang) return;
    document.cookie = `${COOKIE_LANG}=${a}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };
  return (
    <div className={`${boton} gap-0.5 px-1 text-[11px] font-semibold uppercase tracking-wide`} role="group" aria-label="Idioma / Language">
      {(["es", "en"] as Lang[]).map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => cambiar(a)}
          aria-pressed={lang === a}
          className={`rounded-full px-2 py-1 transition-colors ${
            lang === a ? "bg-black/10 text-foreground dark:bg-white/15" : "hover:text-foreground"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
