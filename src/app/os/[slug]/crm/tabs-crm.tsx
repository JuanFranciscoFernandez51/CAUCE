"use client";

import { useState, type ReactNode } from "react";

/** Clientes y consultas son la misma gente: van juntas, no en dos pestañas. */
export function TabsCrm({
  clientes,
  consultas,
  sinResponder,
}: {
  clientes: ReactNode;
  consultas: ReactNode;
  sinResponder: number;
}) {
  const [tab, setTab] = useState<"clientes" | "consultas">("clientes");
  const btn = (activo: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      activo ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("clientes")} className={btn(tab === "clientes")}>
          Clientes
        </button>
        <button onClick={() => setTab("consultas")} className={btn(tab === "consultas")}>
          Consultas
          {sinResponder ? (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {sinResponder}
            </span>
          ) : null}
        </button>
      </div>
      {tab === "clientes" ? clientes : consultas}
    </div>
  );
}
