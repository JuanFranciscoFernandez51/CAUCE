"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Concretar / cancelar una operación vigente desde la lista, con un click. */
export function OperacionEstadoBtns({
  slug,
  id,
  tipo,
}: {
  slug: string;
  id: string;
  tipo: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cambiar(estado: "CONCRETADA" | "CANCELADA") {
    const msg =
      estado === "CONCRETADA"
        ? tipo === "BOLETO"
          ? "¿Concretar la venta? Se registra el ingreso en Finanzas y el vehículo pasa a vendido."
          : "¿Marcar el mandato como concretado? Si hay comisión, se registra en Finanzas."
        : "¿Cancelar esta operación?";
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/conce/operaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        alert(d?.error ?? "No se pudo actualizar");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`flex items-center gap-1 ${busy ? "opacity-50" : ""}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => cambiar("CONCRETADA")}
        title={tipo === "BOLETO" ? "Concretar venta" : "Concretar mandato"}
        className="rounded-md border border-success/40 px-2 py-1 text-xs font-semibold text-success hover:bg-success/10"
      >
        ✔ Concretar
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => cambiar("CANCELADA")}
        title="Cancelar"
        className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive"
      >
        ✕
      </button>
    </span>
  );
}
