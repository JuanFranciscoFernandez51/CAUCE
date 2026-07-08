"use client";

import { useState, type ReactNode } from "react";

/** Dos pestañas: armar presupuesto (lo que se usa todos los días) y la config. */
export function PricingTabs({ armador, config }: { armador: ReactNode; config: ReactNode }) {
  const [tab, setTab] = useState<"armador" | "config">("armador");
  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b">
        {(
          [
            { key: "armador", label: "Armar presupuesto" },
            { key: "config", label: "Configuración de precios" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="pt-6">{tab === "armador" ? armador : config}</div>
    </div>
  );
}
