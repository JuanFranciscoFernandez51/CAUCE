"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, ErrorState } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { fmtArs } from "../money";
import { relativeTime } from "../../_lib/dates";
import type { BazarItem, PedidoEstado } from "@/lib/bazar";

export type PedidoBoard = {
  id: string;
  numero: number;
  estado: string;
  items: BazarItem[];
  subtotal: number;
  descuentoTipo: string | null;
  descuentoMonto: number;
  envio: number;
  total: number;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  cp: string | null;
  notas: string | null;
  retiroEnLocal: boolean;
  seguimiento: string | null;
  fecha: string;
};

const COLUMNAS: { estado: PedidoEstado; titulo: string; tono: string }[] = [
  { estado: "NUEVO", titulo: "🕐 Nuevos (sin pagar)", tono: "border-t-gray-400" },
  { estado: "PAGADO", titulo: "💳 Pagados", tono: "border-t-primary" },
  { estado: "ESPERANDO", titulo: "⏳ Esperando el producto", tono: "border-t-warning" },
  { estado: "PREPARANDO", titulo: "📦 Preparando", tono: "border-t-warning" },
  { estado: "DESPACHADO", titulo: "🚚 Despachados", tono: "border-t-accent" },
  { estado: "ENTREGADO", titulo: "✅ Entregados", tono: "border-t-success" },
];

/** El paso siguiente natural de cada estado (botón grande 1-click). */
const SIGUIENTE: Partial<Record<PedidoEstado, { estado: PedidoEstado; label: string }>> = {
  PAGADO: { estado: "PREPARANDO", label: "→ Preparar" },
  ESPERANDO: { estado: "PREPARANDO", label: "→ Llegó, preparar" },
  PREPARANDO: { estado: "DESPACHADO", label: "→ Despachar" },
  DESPACHADO: { estado: "ENTREGADO", label: "→ Entregado" },
};

/** Mensaje de WhatsApp armado según el estado del pedido. */
function mensajeWa(p: PedidoBoard): string {
  const saludo = `¡Hola ${p.nombre.split(" ")[0]}!`;
  switch (p.estado) {
    case "NUEVO":
      return `${saludo} Recibimos tu pedido #${p.numero} por ${fmtArs(p.total)}. Te pasamos los datos para coordinar el pago. 🐚`;
    case "PAGADO":
      return `${saludo} ¡Confirmamos el pago de tu pedido #${p.numero}! Ya lo estamos preparando. 🐚`;
    case "PREPARANDO":
      return `${saludo} Tu pedido #${p.numero} está en preparación. Apenas salga te avisamos. 📦`;
    case "DESPACHADO":
      return `${saludo} ¡Tu pedido #${p.numero} ya fue despachado! 🚚${p.seguimiento ? ` Seguimiento: ${p.seguimiento}` : ""}`;
    case "ENTREGADO":
      return `${saludo} ¡Gracias por tu compra! Esperamos que disfrutes tu pedido #${p.numero}. Cualquier cosa, acá estamos. 🌊`;
    default:
      return `${saludo} Te escribimos por tu pedido #${p.numero}.`;
  }
}

export function DespachoBoard({
  slug,
  pedidos,
  filtroInicial,
}: {
  slug: string;
  pedidos: PedidoBoard[];
  filtroInicial: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [soloCancelados, setSoloCancelados] = useState(filtroInicial === "CANCELADO");
  const [resaltado] = useState(
    filtroInicial && filtroInicial !== "CANCELADO" ? filtroInicial : null
  );

  async function patch(p: PedidoBoard, data: Record<string, unknown>) {
    setBusyId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/pedidos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo actualizar el pedido");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  const cancelados = pedidos.filter((p) => p.estado === "CANCELADO");

  if (soloCancelados) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSoloCancelados(false)}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Volver al tablero
        </button>
        {cancelados.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay pedidos cancelados. 🎉
          </p>
        ) : (
          cancelados.map((p) => (
            <TarjetaPedido
              key={p.id}
              p={p}
              slug={slug}
              busy={busyId === p.id}
              abierto={abierto === p.id}
              onToggle={() => setAbierto(abierto === p.id ? null : p.id)}
              onPatch={(data) => patch(p, data)}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSoloCancelados(true)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Ver cancelados ({cancelados.length})
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNAS.map((col) => {
          const enCol = pedidos.filter((p) => p.estado === col.estado);
          return (
            <div
              key={col.estado}
              className={`rounded-lg border border-t-4 bg-card ${col.tono} ${resaltado === col.estado ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <h2 className="text-sm font-semibold">{col.titulo}</h2>
                <Badge>{enCol.length}</Badge>
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
                {enCol.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Vacío</p>
                ) : (
                  enCol.map((p) => (
                    <TarjetaPedido
                      key={p.id}
                      p={p}
                      slug={slug}
                      busy={busyId === p.id}
                      abierto={abierto === p.id}
                      onToggle={() => setAbierto(abierto === p.id ? null : p.id)}
                      onPatch={(data) => patch(p, data)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TarjetaPedido({
  p,
  slug,
  busy,
  abierto,
  onToggle,
  onPatch,
}: {
  p: PedidoBoard;
  slug: string;
  busy: boolean;
  abierto: boolean;
  onToggle: () => void;
  onPatch: (data: Record<string, unknown>) => void;
}) {
  const siguiente = SIGUIENTE[p.estado as PedidoEstado];
  const wa = `https://wa.me/${p.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensajeWa(p))}`;

  return (
    <div className={`rounded-md border bg-background p-2.5 text-sm ${busy ? "opacity-60" : ""}`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">#{p.numero}</span>
          <span className="font-semibold">{fmtArs(p.total)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-muted-foreground">{p.nombre}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(p.fecha)}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant={p.retiroEnLocal ? "default" : "primary"}>
            {p.retiroEnLocal ? "🏖️ Retiro" : "🚚 Envío"}
          </Badge>
          {p.descuentoTipo ? (
            <Badge variant="success">
              {p.descuentoTipo === "CUENTA10" ? "10% cuenta" : "cupón 5%"}
            </Badge>
          ) : null}
          <Badge>{p.items.reduce((s, i) => s + i.cant, 0)} ítems</Badge>
        </div>
      </button>

      {abierto ? (
        <div className="mt-2 space-y-2 border-t pt-2">
          {/* Ficha: items */}
          <ul className="space-y-1">
            {p.items.map((i) => (
              <li key={i.productoId} className="flex items-center gap-2">
                {i.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.foto} alt="" className="h-7 w-7 rounded border object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs">
                    🐚
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{i.nombre}</span>
                <span className="shrink-0 text-xs font-semibold">×{i.cant}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-muted-foreground">
            Subtotal {fmtArs(p.subtotal)}
            {p.descuentoMonto > 0 ? ` · desc. −${fmtArs(p.descuentoMonto)}` : ""}
            {p.envio > 0 ? ` · envío ${fmtArs(p.envio)}` : ""}
          </div>

          {/* Datos de envío/contacto */}
          <div className="rounded bg-muted/50 p-2 text-xs">
            <p>📞 {p.telefono}</p>
            {p.email ? <p>✉️ {p.email}</p> : null}
            {!p.retiroEnLocal ? (
              <p>
                📍 {p.direccion}
                {p.ciudad ? `, ${p.ciudad}` : ""}
                {p.cp ? ` (CP ${p.cp})` : ""}
              </p>
            ) : (
              <p>🏖️ Retira por el local</p>
            )}
            {p.notas ? <p className="mt-1 italic">“{p.notas}”</p> : null}
          </div>

          {/* Seguimiento inline (para envíos) */}
          {!p.retiroEnLocal ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Seguimiento:</span>
              <InlineEdit
                endpoint={`/api/os/${slug}/bazar/pedidos/${p.id}`}
                field="seguimiento"
                value={p.seguimiento}
                placeholder="agregar nro…"
              />
            </div>
          ) : null}

          {/* Acciones */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {p.estado === "NUEVO" ? (
              <>
                <button
                  type="button"
                  onClick={() => onPatch({ estado: "PAGADO", medio: "mp" })}
                  className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  💳 Pagó por MP
                </button>
                <button
                  type="button"
                  onClick={() => onPatch({ estado: "PAGADO", medio: "efectivo" })}
                  className="rounded-md border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  💵 Pagó en efectivo
                </button>
              </>
            ) : null}
            {siguiente ? (
              <button
                type="button"
                onClick={() => onPatch({ estado: siguiente.estado })}
                className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                {siguiente.label}
              </button>
            ) : null}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              💬 WhatsApp
            </a>
            {p.estado !== "ENTREGADO" && p.estado !== "CANCELADO" ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Cancelar el pedido #${p.numero}?`)) onPatch({ estado: "CANCELADO" });
                }}
                className="ml-auto rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                Cancelar
              </button>
            ) : null}
            {p.estado === "CANCELADO" ? (
              <button
                type="button"
                onClick={() => onPatch({ estado: "NUEVO" })}
                className="rounded-md border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Reactivar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
