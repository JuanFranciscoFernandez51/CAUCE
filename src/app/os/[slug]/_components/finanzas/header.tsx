import type { ReactNode } from "react";
import { FinanzasNav } from "./nav";

/** Encabezado común de todas las pantallas de Finanzas: título + acciones + nav. */
export function FinanzasHeader({
  slug,
  subtitle,
  actions,
}: {
  slug: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <FinanzasNav slug={slug} />
    </div>
  );
}
