"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";

/**
 * Botón para generar/actualizar el reporte del mes actual.
 * POST a /api/os/[slug]/reportes → regenera con datos frescos → refresca la página.
 */
export function ReportRefreshButton({
  slug,
  label = "Actualizar reporte de este mes",
}: {
  slug: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function regenerate() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/os/${slug}/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center">
      <Button variant="secondary" size="sm" onClick={regenerate} disabled={busy}>
        {busy ? <Spinner /> : "🔄"} {label}
      </Button>
      {error ? (
        <span className="text-xs text-destructive">No se pudo actualizar, probá de nuevo.</span>
      ) : null}
    </div>
  );
}
