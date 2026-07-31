"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtPrecio, PEDIDO_ESTADO_LABEL, type PedidoEstado } from "@/lib/bazar";

export type ItemPedido = { nombre: string; precio: number; cant: number; sku?: string };
export type PedidoFila = {
  id: string;
  numero: number;
  fecha: string;
  nombre: string;
  telefono: string;
  email: string | null;
  items: ItemPedido[];
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  estado: PedidoEstado;
  retiroEnLocal: boolean;
  direccion: string | null;
  ciudad: string | null;
  cp: string | null;
  seguimiento: string | null;
  notas: string | null;
  pagoMp: boolean;
};

/** Pestañas del tablero. "Todos" primero; el resto sigue el camino del pedido. */
const TABS: { key: string; label: string; estados: PedidoEstado[] }[] = [
  { key: "todos", label: "Todos", estados: [] },
  { key: "por-pagar", label: "Por pagar", estados: ["NUEVO"] },
  { key: "pagos", label: "Pagos", estados: ["PAGADO"] },
  { key: "esperando", label: "Esperando el producto", estados: ["ESPERANDO"] },
  { key: "preparando", label: "Preparando", estados: ["PREPARANDO"] },
  { key: "despachados", label: "Despachados", estados: ["DESPACHADO"] },
  { key: "entregados", label: "Entregados", estados: ["ENTREGADO"] },
  { key: "cancelados", label: "Cancelados", estados: ["CANCELADO"] },
];

/** El paso siguiente natural, más la salida por "no lo tengo". */
const PASOS: Partial<Record<PedidoEstado, { a: PedidoEstado; label: string }[]>> = {
  NUEVO: [
    { a: "PAGADO", label: "Cobrado" },
    { a: "CANCELADO", label: "Cancelar" },
  ],
  PAGADO: [
    { a: "PREPARANDO", label: "Preparar" },
    { a: "ESPERANDO", label: "Falta el repuesto" },
  ],
  ESPERANDO: [{ a: "PREPARANDO", label: "Llegó → preparar" }],
  PREPARANDO: [{ a: "DESPACHADO", label: "Despachar" }],
  DESPACHADO: [{ a: "ENTREGADO", label: "Entregado" }],
};

const TONO: Record<PedidoEstado, string> = {
  NUEVO: "bg-muted text-muted-foreground",
  PAGADO: "bg-primary/20 text-primary",
  ESPERANDO: "bg-amber-500/20 text-amber-400",
  PREPARANDO: "bg-orange-500/15 text-orange-400",
  DESPACHADO: "bg-sky-500/15 text-sky-400",
  ENTREGADO: "bg-emerald-500/15 text-emerald-400",
  CANCELADO: "bg-destructive/10 text-destructive",
};

function mensajeWa(p: PedidoFila): string {
  const hola = `¡Hola ${p.nombre.split(" ")[0]}!`;
  const n = `pedido #${p.numero}`;
  if (p.estado === "NUEVO") return `${hola} Te paso los datos para abonar tu ${n} por ${fmtPrecio(p.total)}.`;
  if (p.estado === "ESPERANDO")
    return `${hola} Tu ${n} está en camino desde el proveedor. Apenas llega te aviso y lo despacho.`;
  if (p.estado === "PREPARANDO") return `${hola} Ya estamos preparando tu ${n}.`;
  if (p.estado === "DESPACHADO")
    return `${hola} Despachamos tu ${n}${p.seguimiento ? `. Seguimiento: ${p.seguimiento}` : ""}.`;
  if (p.estado === "PAGADO") return `${hola} Recibimos el pago de tu ${n}. Ya lo preparamos.`;
  return `${hola} Te escribo por tu ${n}.`;
}

export function PedidosPanel({ slug, pedidos }: { slug: string; pedidos: PedidoFila[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("todos");
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cuenta = useMemo(() => {
    const m: Record<string, number> = { todos: pedidos.length };
    for (const t of TABS.slice(1)) m[t.key] = pedidos.filter((p) => t.estados.includes(p.estado)).length;
    return m;
  }, [pedidos]);

  const visibles = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const txt = q.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (t.estados.length && !t.estados.includes(p.estado)) return false;
      if (!txt) return true;
      return (
        String(p.numero).includes(txt) ||
        p.nombre.toLowerCase().includes(txt) ||
        p.telefono.includes(txt) ||
        p.items.some((i) => i.nombre.toLowerCase().includes(txt))
      );
    });
  }, [pedidos, tab, q]);

  async function mover(p: PedidoFila, a: PedidoEstado) {
    if (a === "DESPACHADO" && !p.seguimiento) {
      const seg = window.prompt("Número de seguimiento del correo (podés dejarlo vacío):", "");
      if (seg) await patch(p, { seguimiento: seg });
    }
    await patch(p, { estado: a });
  }

  async function patch(p: PedidoFila, data: Record<string, unknown>) {
    setOcupado(p.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/pedidos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "No se pudo guardar");
      } else {
        router.refresh();
      }
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Pestañas + buscador */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.key ? "opacity-70" : "opacity-60"}`}>{cuenta[t.key] ?? 0}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por N°, cliente, teléfono o repuesto…"
          className="ml-auto h-9 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No hay pedidos acá.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">N°</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Pedido</th>
                <th className="px-3 py-2.5">Entrega</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">Qué sigue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.map((p) => {
                const pasos = PASOS[p.estado] ?? [];
                const wa = `https://wa.me/${p.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensajeWa(p))}`;
                const unidades = p.items.reduce((a, i) => a + i.cant, 0);
                return (
                  <>
                    <tr key={p.id} className={ocupado === p.id ? "opacity-50" : ""}>
                      <td className="px-3 py-2.5 font-semibold">
                        <button onClick={() => setAbierto(abierto === p.id ? null : p.id)} className="hover:underline">
                          #{p.numero}
                        </button>
                        <p className="text-[11px] font-normal text-muted-foreground">{p.fecha}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{p.nombre}</p>
                        <a href={wa} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">
                          {p.telefono} · WhatsApp
                        </a>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setAbierto(abierto === p.id ? null : p.id)} className="text-left hover:underline">
                          {unidades} {unidades === 1 ? "unidad" : "unidades"}
                          <span className="block text-[11px] text-muted-foreground">
                            {p.items[0]?.nombre.slice(0, 34)}
                            {p.items.length > 1 ? ` +${p.items.length - 1}` : ""}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {p.retiroEnLocal ? (
                          <span className="text-muted-foreground">Retira en el local</span>
                        ) : (
                          <>
                            <p>{p.ciudad ?? "—"}</p>
                            <input
                              defaultValue={p.seguimiento ?? ""}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v !== (p.seguimiento ?? "")) patch(p, { seguimiento: v });
                              }}
                              placeholder="N° seguimiento"
                              className="mt-1 w-32 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] outline-none focus:border-primary"
                            />
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {fmtPrecio(p.total)}
                        {p.envio ? <span className="block text-[11px] font-normal text-muted-foreground">envío {fmtPrecio(p.envio)}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONO[p.estado]}`}>
                          {PEDIDO_ESTADO_LABEL[p.estado]}
                        </span>
                        {p.pagoMp ? <span className="ml-1 text-[11px] text-muted-foreground">MP</span> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {pasos.map((s) => (
                            <button
                              key={s.a}
                              disabled={ocupado === p.id}
                              onClick={() => mover(p, s.a)}
                              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                                s.a === "CANCELADO"
                                  ? "text-muted-foreground hover:text-destructive"
                                  : "bg-foreground text-background hover:opacity-90"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {abierto === p.id ? (
                      <tr key={`${p.id}-det`} className="bg-muted/30">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repuestos</p>
                              <ul className="mt-1.5 space-y-1">
                                {p.items.map((i, n) => (
                                  <li key={n} className="flex justify-between gap-3 text-sm">
                                    <span>
                                      {i.cant} × {i.nombre}
                                      {i.sku ? <span className="ml-1 text-xs text-muted-foreground">({i.sku})</span> : null}
                                    </span>
                                    <span className="tabular-nums">{fmtPrecio(i.precio * i.cant)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 border-t border-border pt-2 text-sm">
                                <p className="flex justify-between text-muted-foreground">
                                  <span>Subtotal</span> <span>{fmtPrecio(p.subtotal)}</span>
                                </p>
                                {p.descuento ? (
                                  <p className="flex justify-between text-muted-foreground">
                                    <span>Descuento</span> <span>−{fmtPrecio(p.descuento)}</span>
                                  </p>
                                ) : null}
                                <p className="flex justify-between text-muted-foreground">
                                  <span>Envío</span> <span>{p.envio ? fmtPrecio(p.envio) : "sin cargo"}</span>
                                </p>
                                <p className="flex justify-between font-semibold">
                                  <span>Total</span> <span>{fmtPrecio(p.total)}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrega</p>
                              {p.retiroEnLocal ? (
                                <p className="mt-1.5">Retira en el local</p>
                              ) : (
                                <p className="mt-1.5 leading-relaxed">
                                  {p.direccion ?? "—"}
                                  <br />
                                  {p.ciudad ?? ""} {p.cp ? `(${p.cp})` : ""}
                                </p>
                              )}
                              {p.email ? <p className="mt-2 text-xs text-muted-foreground">{p.email}</p> : null}
                              {p.notas ? (
                                <p className="mt-2 rounded-lg bg-background px-2.5 py-2 text-xs">📝 {p.notas}</p>
                              ) : null}
                              <a
                                href={wa}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Escribirle por WhatsApp
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
