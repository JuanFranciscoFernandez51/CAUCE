"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OT_ESTADOS } from "./estados";

const ORDEN = ["INGRESADA", "EN_DIAGNOSTICO", "APROBADA", "EN_REPARACION", "LISTA", "ENTREGADA", "CANCELADA"];

/** Estado de la OT editable desde la lista, sin entrar al detalle. */
export function OtEstadoSelect({
  slug,
  otId,
  estado,
}: {
  slug: string;
  otId: string;
  estado: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cambiar(next: string) {
    if (next === estado) return;
    setBusy(true);
    const res = await fetch(`/api/os/${slug}/taller/${otId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <select
      value={estado}
      disabled={busy}
      onChange={(e) => void cambiar(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Cambiar estado de la orden"
      className="h-8 rounded-md border border-input bg-card px-2 text-xs font-medium disabled:opacity-50"
    >
      {ORDEN.map((k) => (
        <option key={k} value={k}>
          {OT_ESTADOS[k]?.label ?? k}
        </option>
      ))}
    </select>
  );
}
