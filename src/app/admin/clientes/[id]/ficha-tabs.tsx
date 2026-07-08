"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "armado", label: "Cómo está armado" },
  { key: "datos", label: "Datos" },
  { key: "uso", label: "Uso y reportes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * Pestañas de la ficha de cliente: lo primero que se ve es el PROCESO
 * (cómo está armado); los datos y el uso viven en sus apartados.
 */
export function FichaTabs({
  armado,
  datos,
  uso,
}: {
  armado: ReactNode;
  datos: ReactNode;
  uso: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("armado");
  const panels: Record<TabKey, ReactNode> = { armado, datos, uso };

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b">
        {TABS.map((t) => {
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
      <div className="pt-6">{panels[tab]}</div>
    </div>
  );
}
