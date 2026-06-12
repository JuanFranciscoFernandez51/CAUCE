"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

/** Borrado de un movimiento de caja, con confirm(). */
export function CashDeleteButton({
  slug,
  movementId,
  concept,
}: {
  slug: string;
  movementId: string;
  concept: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onDelete() {
    if (!confirm(`¿Borrar “${concept}”? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/os/${slug}/cash/${movementId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (busy) return <Spinner className="text-muted-foreground" />;

  return (
    <div className="flex items-center gap-1.5">
      {error ? <span className="text-xs text-destructive">Error, probá de nuevo</span> : null}
      <button
        type="button"
        onClick={onDelete}
        className="h-7 rounded border bg-card px-2 text-xs font-medium text-destructive hover:bg-muted"
      >
        Borrar
      </button>
    </div>
  );
}
