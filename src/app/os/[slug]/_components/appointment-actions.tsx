"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApptStatus } from "@prisma/client";
import { Spinner } from "@/components/ui";

/** Acciones rápidas de estado para un turno: Confirmar / Cancelar / Hecho. */
export function AppointmentActions({
  slug,
  appointmentId,
  status,
}: {
  slug: string;
  appointmentId: string;
  status: ApptStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function setStatus(next: ApptStatus) {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/os/${slug}/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "h-7 rounded border bg-card px-2 text-xs font-medium hover:bg-muted disabled:opacity-50";

  if (busy) return <Spinner className="text-muted-foreground" />;

  return (
    <div className="flex items-center gap-1.5">
      {error ? <span className="text-xs text-destructive">Error, probá de nuevo</span> : null}
      {status === "PENDING" ? (
        <>
          <button type="button" className={`${btn} text-success`} onClick={() => setStatus("CONFIRMED")}>
            Confirmar
          </button>
          <button type="button" className={`${btn} text-destructive`} onClick={() => setStatus("CANCELLED")}>
            Cancelar
          </button>
        </>
      ) : null}
      {status === "CONFIRMED" ? (
        <>
          <button type="button" className={`${btn} text-primary`} onClick={() => setStatus("DONE")}>
            Hecho
          </button>
          <button type="button" className={`${btn} text-destructive`} onClick={() => setStatus("CANCELLED")}>
            Cancelar
          </button>
        </>
      ) : null}
      {status === "CANCELLED" ? (
        <button type="button" className={btn} onClick={() => setStatus("PENDING")}>
          Reabrir
        </button>
      ) : null}
      {status === "DONE" ? (
        <button type="button" className={btn} onClick={() => setStatus("CONFIRMED")}>
          Deshacer
        </button>
      ) : null}
    </div>
  );
}
