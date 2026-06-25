"use client";

import { useEffect, useState } from "react";

/** Evento no estándar de Chromium para instalar PWAs. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Banner discreto "Instalá la app" dentro del OS. Escucha beforeinstallprompt
 * y dispara el prompt nativo del navegador. Si el navegador no lo soporta
 * (iOS Safari) o la app ya está instalada, no muestra nada. Usa los tokens del
 * tenant (--primary aplicado por el layout del OS).
 */
export function InstallPrompt({ appName }: { appName: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya está instalada (corriendo en modo standalone), no molestamos.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari expone navigator.standalone.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  };

  return (
    <div className="mx-auto mb-4 w-full max-w-6xl px-4 sm:px-6">
      <div className="flex items-center gap-3 rounded-lg border bg-primary-soft px-4 py-3">
        <span className="text-xl" aria-hidden>
          📲
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            Instalá {appName} en tu celu
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Acceso directo en la pantalla de inicio, como una app.
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="shrink-0 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
