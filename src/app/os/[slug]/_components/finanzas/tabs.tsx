import Link from "next/link";
import type { ReactNode } from "react";

type Tab = "dia" | "saldos" | "mes" | "ano";

const TABS: { key: Tab; label: string }[] = [
  { key: "dia", label: "Caja del día" },
  { key: "saldos", label: "Saldos" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
];

/** Tabs de Finanzas: navegación por query param, preserva mes/año elegidos. */
export function FinanzasTabs({
  slug,
  active,
  month,
  year,
  children,
}: {
  slug: string;
  active: Tab;
  month: string;
  year: string;
  children: ReactNode;
}) {
  const base = `/os/${slug}/caja`;
  return (
    <div className="space-y-4">
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto border-b pb-px">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const q = new URLSearchParams({ tab: t.key, month, year });
          return (
            <Link
              key={t.key}
              href={`${base}?${q.toString()}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
