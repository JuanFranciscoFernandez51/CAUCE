"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return <button className="h-9 w-9 rounded-md border" aria-label="Cambiar tema" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Cambiar tema"
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-md border bg-card text-lg transition-colors hover:bg-muted"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
