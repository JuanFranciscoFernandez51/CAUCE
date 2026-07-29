"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Estado = "FIRMADO" | "CONCRETADA" | "CANCELADA";

const MENSAJES: Record<Estado, Record<"MANDATO" | "BOLETO", string>> = {
  FIRMADO: {
    MANDATO:
      "¿Marcar el mandato como FIRMADO?\n\nEl vehículo entra solo al stock SIN PUBLICAR (queda listo para revisar fotos y precio antes de sacarlo a la web).",
    BOLETO:
      "¿Marcar el boleto como FIRMADO?\n\nSi cargaste permutas, esos vehículos entran solos al stock sin publicar.",
  },
  CONCRETADA: {
    MANDATO:
      "¿Concretar el mandato? Si hay comisión, se registra en Finanzas y el vehículo pasa a vendido.",
    BOLETO:
      "¿Concretar la venta (entregado)?\n\nEl vehículo pasa a VENDIDO y sale del stock disponible, la venta entra a Finanzas y las permutas cargadas entran al stock.",
  },
  CANCELADA: {
    MANDATO: "¿Anular el mandato? El vehículo que entró por él queda sin publicar.",
    BOLETO: "¿Anular el boleto? Se libera el vehículo reservado.",
  },
};

/** Firmar / concretar / anular una operación con un click, desde la lista o la ficha. */
export function OperacionEstadoBtns({
  slug,
  id,
  tipo,
  estado,
}: {
  slug: string;
  id: string;
  tipo: string;
  estado: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cambiar(nuevo: Estado) {
    const t = tipo === "MANDATO" ? "MANDATO" : "BOLETO";
    if (!confirm(MENSAJES[nuevo][t])) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/conce/operaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
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

  if (estado === "CONCRETADA" || estado === "CANCELADA") return null;

  return (
    <span className={`flex items-center gap-1 ${busy ? "opacity-50" : ""}`}>
      {estado === "VIGENTE" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => cambiar("FIRMADO")}
          title={
            tipo === "MANDATO"
              ? "Firmado: el vehículo entra al stock sin publicar"
              : "Firmado: las permutas entran al stock"
          }
          className="rounded-md border border-primary/40 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-soft"
        >
          ✍ Firmar
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => cambiar("CONCRETADA")}
        title={tipo === "BOLETO" ? "Concretar / entregar" : "Concretar mandato"}
        className="rounded-md border border-success/40 px-2 py-1 text-xs font-semibold text-success hover:bg-success/10"
      >
        ✔ {tipo === "BOLETO" ? "Entregar" : "Concretar"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => cambiar("CANCELADA")}
        title="Anular"
        className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive"
      >
        ✕
      </button>
    </span>
  );
}
