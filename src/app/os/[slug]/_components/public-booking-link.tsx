"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Banner con el link al calendario público de auto-agendado, copiable.
 * El path es relativo (/agendar/<slug>); mostramos el origin sólo en runtime
 * (window) para que el dueño copie la URL completa lista para compartir.
 */
export function PublicBookingLink({ slug }: { slug: string }) {
  const path = `/agendar/${slug}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    const full = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard puede fallar sin https; el dueño igual ve el link en pantalla.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm">
      <span className="text-card-foreground">
        🔗 Compartí este link para que te agenden solos:
      </span>
      <code className="rounded bg-card px-2 py-0.5 font-mono text-xs">{path}</code>
      <div className="ml-auto flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={copy}>
          {copied ? "¡Copiado!" : "Copiar"}
        </Button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-primary hover:underline"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}
