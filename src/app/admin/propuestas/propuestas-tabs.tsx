"use client";

import { useState, type ReactNode } from "react";

/** Armar el presupuesto y seguir lo enviado, en la misma pantalla. */
export function PropuestasTabs({ armar, enviadas, cuantas }: { armar: ReactNode; enviadas: ReactNode; cuantas: number }) {
  const [tab, setTab] = useState<"armar" | "enviadas">("armar");
  const btn = (activo: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      activo ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("armar")} className={btn(tab === "armar")}>
          Armar propuesta
        </button>
        <button onClick={() => setTab("enviadas")} className={btn(tab === "enviadas")}>
          Enviadas <span className="ml-1 text-xs opacity-70">{cuantas}</span>
        </button>
      </div>
      {tab === "armar" ? armar : enviadas}
    </div>
  );
}
