"use client";

import { useEffect, useState } from "react";

/**
 * Switch del agente nocturno de leads: prende/apaga la bandera en la DB.
 * El script de la madrugada (3:33) la consulta antes de arrancar.
 */
export function AgenteSwitch() {
  const [activa, setActiva] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/admin/agente-leads")
      .then((r) => r.json())
      .then((d) => setActiva(Boolean(d.activa)))
      .catch(() => setActiva(true));
  }, []);

  async function toggle() {
    if (activa === null || guardando) return;
    setGuardando(true);
    const nueva = !activa;
    setActiva(nueva);
    await fetch("/api/admin/agente-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: nueva }),
    }).catch(() => setActiva(!nueva));
    setGuardando(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">🌙 Agente nocturno</p>
        <p className="text-xs text-muted-foreground">
          Arma la demo del lead más nuevo cada madrugada (3:33)
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={activa === null}
        aria-label={activa ? "Apagar agente nocturno" : "Prender agente nocturno"}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          activa ? "bg-success" : "bg-muted-foreground/30"
        } ${activa === null ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            activa ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
