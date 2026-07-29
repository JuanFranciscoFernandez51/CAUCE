"use client";

import { useState } from "react";

/**
 * Botón de copiar al portapapeles con feedback "¡Copiado!".
 * Lo pidió Fran para el CBU, el alias y el CUIT de los proveedores: se toca
 * una vez y se pega en el homebanking sin transcribir 22 dígitos a mano.
 */
export function CopiarBtn({
  valor,
  etiqueta,
  className = "",
}: {
  valor: string | null | undefined;
  /** Qué se está copiando ("CBU", "Alias", "CUIT") — va en el título. */
  etiqueta?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(false);
  const limpio = (valor ?? "").trim();
  if (!limpio) return null;

  async function copiar() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(limpio);
      } else {
        // Fallback para navegadores viejos / http sin permisos.
        const ta = document.createElement("textarea");
        ta.value = limpio;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 1600);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copiar();
      }}
      title={etiqueta ? `Copiar ${etiqueta}` : "Copiar"}
      aria-label={etiqueta ? `Copiar ${etiqueta}` : "Copiar"}
      className={[
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium transition-colors",
        copiado
          ? "border-success/40 bg-success/15 text-success"
          : error
            ? "border-destructive/40 bg-destructive/15 text-destructive"
            : "text-muted-foreground hover:border-primary hover:bg-primary-soft hover:text-primary",
        className,
      ].join(" ")}
    >
      {copiado ? "✓ ¡Copiado!" : error ? "no se pudo" : "⧉ Copiar"}
    </button>
  );
}

/** Dato + botón de copiar en una línea (CBU, alias, CUIT, nº de cuenta). */
export function DatoCopiable({
  label,
  valor,
  mono = true,
}: {
  label: string;
  valor: string | null | undefined;
  mono?: boolean;
}) {
  const limpio = (valor ?? "").trim();
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{limpio || "—"}</span>
        <CopiarBtn valor={limpio} etiqueta={label} />
      </span>
    </div>
  );
}
