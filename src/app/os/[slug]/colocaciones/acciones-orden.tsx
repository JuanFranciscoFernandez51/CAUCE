"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Los estados por los que pasa una orden hasta la entrega. */
export const FLUJO = ["PENDIENTE", "CONFIRMADA", "COLOCADO", "ENTREGADO"] as const;
export const FLUJO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "En taller",
  COLOCADO: "Colocado",
  ENTREGADO: "Entregado",
};

/** WhatsApp al cliente con un mensaje según en qué anda la orden. */
export function BotonWhatsApp({
  telefono,
  nombre,
  numero,
  estado,
  fecha,
  compacto,
}: {
  telefono: string | null;
  nombre: string;
  numero: number;
  estado: string;
  fecha?: string | null;
  compacto?: boolean;
}) {
  if (!telefono) return null;
  const limpio = telefono.replace(/\D/g, "");
  const tel = limpio.startsWith("54") ? limpio : `54${limpio.replace(/^0/, "")}`;
  const num = String(numero).padStart(4, "0");
  const dia = fecha ? fecha.split("-").reverse().join("/") : null;

  const texto =
    estado === "CONFIRMADA"
      ? `Hola ${nombre}! Te escribimos de Código Auto por tu orden #${num}. Te esperamos${dia ? ` el ${dia}` : ""} en 9 de Julio 578 para la colocación.`
      : estado === "COLOCADO"
        ? `Hola ${nombre}! Ya está colocado el vidrio de tu orden #${num}. Cuando quieras pasás a retirar el vehículo.`
        : estado === "ENTREGADO"
          ? `Hola ${nombre}! Gracias por confiar en Código Auto. Cualquier cosa que necesites, escribinos.`
          : `Hola ${nombre}! Te escribimos de Código Auto por tu pedido #${num}.`;

  return (
    <a
      href={`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`}
      target="_blank"
      rel="noreferrer"
      title={`WhatsApp a ${nombre}`}
      className={`inline-flex items-center gap-1 rounded-md font-semibold transition hover:opacity-80 ${
        compacto ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: "rgba(37,211,102,.15)", color: "#128C4A" }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4.1.2.1.7-.1 1.3Z" />
      </svg>
      {compacto ? "" : "WhatsApp"}
    </a>
  );
}

/** Manda la orden a la bandeja de Facturación. */
export function BotonFacturar({ slug, id }: { slug: string; id: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  return (
    <button
      onClick={async () => {
        setOcupado(true);
        await fetch(`/api/os/${slug}/ordenes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facturacion: "a_facturar" }),
        });
        setOcupado(false);
        router.refresh();
      }}
      disabled={ocupado}
      className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      → Facturar
    </button>
  );
}

/** Avanza la orden al siguiente paso del seguimiento (o la reprograma). */
export function AvanzarOrden({
  slug,
  id,
  estado,
  fecha,
}: {
  slug: string;
  id: string;
  estado: string;
  fecha?: string | null;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [nueva, setNueva] = useState(fecha ?? "");

  async function patch(body: Record<string, unknown>) {
    setOcupado(true);
    await fetch(`/api/os/${slug}/ordenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setOcupado(false);
    setReprogramando(false);
    router.refresh();
  }

  const siguiente = estado === "CONFIRMADA" ? "COLOCADO" : estado === "COLOCADO" ? "ENTREGADO" : null;
  const label = siguiente === "COLOCADO" ? "✓ Colocado" : siguiente === "ENTREGADO" ? "🚗 Entregado" : null;

  return (
    <span className="flex items-center gap-1.5">
      {reprogramando ? (
        <>
          <input
            type="date"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className="h-7 rounded-md border bg-card px-1.5 text-xs"
          />
          <button
            onClick={() => patch({ estado: "CONFIRMADA", fechaColocacion: nueva })}
            disabled={ocupado || !nueva}
            className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            Mover
          </button>
          <button onClick={() => setReprogramando(false)} className="text-xs text-muted-foreground">✕</button>
        </>
      ) : (
        <>
          {estado === "CONFIRMADA" ? (
            <button
              onClick={() => setReprogramando(true)}
              title="Cambiar la fecha de colocación"
              className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted"
            >
              📅
            </button>
          ) : null}
          {siguiente ? (
            <button
              onClick={() => patch({ estado: siguiente })}
              disabled={ocupado}
              className="rounded-md bg-success/15 px-2.5 py-1 text-xs font-semibold text-success transition hover:opacity-80 disabled:opacity-50"
            >
              {label}
            </button>
          ) : null}
        </>
      )}
    </span>
  );
}
