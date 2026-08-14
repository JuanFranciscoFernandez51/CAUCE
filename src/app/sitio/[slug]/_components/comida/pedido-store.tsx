"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CarritoProvider, useCarrito } from "../bazar/carrito-store";

/**
 * Pedido de Casa Milo. No hay checkout: el pedido se arma acá y se cierra por
 * WhatsApp con el detalle y el total ya escritos, que es como trabajan.
 */
/** El pedido usa el carrito de la tienda: mismo checkout, mismo Despacho. */
export function PedidoProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return <CarritoProvider slug={slug}>{children}</CarritoProvider>;
}

const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

/** Barra fija: aparece con el primer producto y cierra el pedido por WhatsApp. */
export function BarraPedido({
  whatsapp,
  minimoKg,
  base,
}: {
  whatsapp: string | null;
  minimoKg?: number;
  base: string;
}) {
  const { items, subtotal: total, cantidadTotal: unidades, vaciar } = useCarrito();
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
            className="px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] motion-reduce:transform-none"
            style={{ border: "1px solid rgba(251,243,222,.4)" }}
          >
            Vaciar
          </button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-[14px] text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] motion-reduce:transform-none"
              style={{ border: "1px solid rgba(251,243,222,.4)" }}
            >
              Cerrar por WhatsApp
            </a>
          ) : null}
          {/* Comprar en la web: datos, pago y el pedido cae en Despacho. */}
          <Link
            href={`${base}/carrito`}
            className="px-[26px] py-[14px] text-[14px] font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
            style={{ backgroundColor: "#A9C6F5", color: "#3A1218" }}
          >
            Completar pedido
          </Link>
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
  producto: { id: string; nombre: string; precio: number; foto?: string | null };
  invertido?: boolean;
}) {
  const { agregar } = useCarrito();
  return (
    <button
      onClick={() =>
        agregar({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, foto: producto.foto ?? null })
      }
      className="px-[18px] py-3 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
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
