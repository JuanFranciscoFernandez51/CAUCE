"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Pedido de Casa Milo. No hay checkout: el pedido se arma acá y se cierra por
 * WhatsApp con el detalle y el total ya escritos, que es como trabajan.
 */
export type ItemPedido = { id: string; nombre: string; precio: number; cant: number };

type Ctx = {
  items: ItemPedido[];
  total: number;
  unidades: number;
  sumar: (p: { id: string; nombre: string; precio: number }) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
};

const PedidoCtx = createContext<Ctx | null>(null);

export function PedidoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemPedido[]>([]);

  const valor = useMemo<Ctx>(() => {
    const sumar = (p: { id: string; nombre: string; precio: number }) =>
      setItems((prev) => {
        const ya = prev.find((i) => i.id === p.id);
        return ya
          ? prev.map((i) => (i.id === p.id ? { ...i, cant: i.cant + 1 } : i))
          : [...prev, { ...p, cant: 1 }];
      });
    const quitar = (id: string) =>
      setItems((prev) => prev.flatMap((i) => (i.id === id ? (i.cant > 1 ? [{ ...i, cant: i.cant - 1 }] : []) : [i])));
    return {
      items,
      total: items.reduce((a, i) => a + i.precio * i.cant, 0),
      unidades: items.reduce((a, i) => a + i.cant, 0),
      sumar,
      quitar,
      vaciar: () => setItems([]),
    };
  }, [items]);

  return <PedidoCtx.Provider value={valor}>{children}</PedidoCtx.Provider>;
}

export function usePedido() {
  const c = useContext(PedidoCtx);
  if (!c) throw new Error("usePedido fuera del PedidoProvider");
  return c;
}

const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

/** Barra fija: aparece con el primer producto y cierra el pedido por WhatsApp. */
export function BarraPedido({ whatsapp, minimoKg }: { whatsapp: string | null; minimoKg?: number }) {
  const { items, total, unidades, vaciar } = usePedido();
  if (!unidades) return null;

  const detalle = items.map((i) => `• ${i.cant} × ${i.nombre} — ${plata(i.precio * i.cant)}`).join("\n");
  const texto = `¡Hola Casa Milo! Quiero hacer este pedido:\n\n${detalle}\n\nTotal: ${plata(total)}${
    minimoKg ? `\n\n(Pedido mínimo ${minimoKg} kg)` : ""
  }`;
  const link = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}` : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] animate-[subir_.22s_ease-out]"
      style={{ backgroundColor: "#3A1218", color: "#FBF3DE" }}
    >
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-7 py-4">
        <p className="text-[15px] font-semibold">
          {unidades} {unidades === 1 ? "producto" : "productos"} en tu pedido
        </p>
        <p className="text-[22px] font-bold" style={{ color: "#A9C6F5" }}>
          {plata(total)}
        </p>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={vaciar}
            className="px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition hover:opacity-80"
            style={{ border: "1px solid rgba(251,243,222,.4)" }}
          >
            Vaciar
          </button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="px-[26px] py-[14px] text-[14px] font-bold uppercase tracking-wide transition hover:opacity-90"
              style={{ backgroundColor: "#A9C6F5", color: "#3A1218" }}
            >
              Cerrar pedido por WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Botón "Sumar" de cada producto. */
export function BotonSumar({
  producto,
  invertido,
}: {
  producto: { id: string; nombre: string; precio: number };
  invertido?: boolean;
}) {
  const { sumar } = usePedido();
  return (
    <button
      onClick={() => sumar(producto)}
      className="px-[18px] py-3 text-[13px] font-semibold uppercase tracking-wide transition hover:opacity-90"
      style={
        invertido
          ? { backgroundColor: "#A9C6F5", color: "#7B2434", fontWeight: 700 }
          : { backgroundColor: "#7B2434", color: "#FBF3DE" }
      }
    >
      Sumar
    </button>
  );
}
