"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtArs } from "../_components/money";

/** Teléfono argentino → formato wa.me. */
function waNumber(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  if (!d.startsWith("549")) d = `549${d.slice(2)}`;
  return d;
}

/**
 * Acciones de la venta desde la LISTA: WhatsApp con el mensaje justo
 * (recordar saldo o avisar que está lista) y registrar un pago sin entrar.
 */
export function VentaAccionesFila({
  slug,
  ventaId,
  nombre,
  telefono,
  descripcion,
  saldo,
  abierta,
}: {
  slug: string;
  ventaId: string;
  nombre: string | null;
  telefono: string | null;
  descripcion: string;
  saldo: number;
  abierta: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const mensaje =
    saldo > 0
      ? `Hola ${nombre?.split(" ")[0] ?? ""}! Te escribimos por tu ${descripcion}: queda un saldo de ${fmtArs(saldo)}. ¿Coordinamos? 🙌`
      : `Hola ${nombre?.split(" ")[0] ?? ""}! Tu ${descripcion} está lista para coordinar la entrega 🙌`;

  async function pagoRapido() {
    const raw = prompt(`Registrar pago de ${nombre ?? "cliente"} (ARS):`, String(saldo > 0 ? saldo : ""));
    if (raw === null) return;
    const monto = Number(raw);
    if (!monto || monto <= 0) return;
    setBusy(true);
    // Traemos los pagos actuales para no pisarlos.
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const res = await fetch(`/api/os/${slug}/ventas/${ventaId}/pago-rapido`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: hoy, montoArs: monto, medio: "efectivo" }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("No se pudo registrar el pago");
  }

  return (
    <span className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {telefono ? (
        <a
          href={`https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={saldo > 0 ? "Recordar saldo por WhatsApp" : "WhatsApp"}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card text-sm hover:bg-muted"
        >
          💬
        </a>
      ) : null}
      {abierta && saldo > 0 ? (
        <button
          type="button"
          onClick={() => void pagoRapido()}
          disabled={busy}
          title="Registrar un pago sin entrar a la venta"
          className="h-8 rounded-md border bg-card px-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          $ Pago
        </button>
      ) : null}
    </span>
  );
}
