"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CarritoProvider, useCarrito } from "../bazar/carrito-store";

/** Umbral real de envío sin cargo (mismo dato que promete el hero y la cinta). */
export const ENVIO_GRATIS = 60000;

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

  // Progreso hacia el envío gratis: vende y es el único dato que vale animar acá.
  const falta = Math.max(0, ENVIO_GRATIS - total);
  const pct = Math.min(100, (total / ENVIO_GRATIS) * 100);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] animate-[subir_.22s_ease-out]"
      style={{ backgroundColor: "#3A1218", color: "#FEFAEF" }}
    >
      {/* Barra de progreso al envío gratis (ancho con transición suave) */}
      <div className="h-[3px] w-full" style={{ backgroundColor: "rgba(254,250,239,0.15)" }}>
        <div
          className="h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%`, backgroundColor: "#B0CEFE" }}
        />
      </div>
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-7 py-4">
        <p className="text-[15px] font-semibold">
          {unidades} {unidades === 1 ? "producto" : "productos"} en tu pedido
        </p>
        <p className="text-[22px] font-bold" style={{ color: "#B0CEFE" }}>
          {plata(total)}
        </p>
        {falta > 0 ? (
          <p className="text-[13px]" style={{ color: "rgba(254,250,239,0.75)" }}>
            Te faltan <strong style={{ color: "#FEFAEF" }}>{plata(falta)}</strong> para el envío gratis
          </p>
        ) : (
          <p
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: "#B0CEFE" }}
          >
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none"
              style={{ backgroundColor: "#B0CEFE" }}
            />
            Envío gratis ganado
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={vaciar}
            className="px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] motion-reduce:transform-none"
            style={{ border: "1px solid rgba(254,250,239,.4)" }}
          >
            Vaciar
          </button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-[14px] text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] motion-reduce:transform-none"
              style={{ border: "1px solid rgba(254,250,239,.4)" }}
            >
              Cerrar por WhatsApp
            </a>
          ) : null}
          {/* Comprar en la web: datos, pago y el pedido cae en Despacho. */}
          <Link
            href={`${base}/carrito`}
            className="px-[26px] py-[14px] text-[14px] font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
            style={{ backgroundColor: "#B0CEFE", color: "#3A1218" }}
          >
            Completar pedido
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Botón "Sumar" de cada producto. Al sumar confirma con un check + pop breve
 *  (keyframe `milo-pop`, definido en el <style> scoped de comida-home). */
export function BotonSumar({
  producto,
  invertido,
}: {
  producto: { id: string; nombre: string; precio: number; foto?: string | null };
  invertido?: boolean;
}) {
  const { agregar } = useCarrito();
  const [ok, setOk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <button
      onClick={() => {
        agregar({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, foto: producto.foto ?? null });
        setOk(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setOk(false), 900);
      }}
      className={`min-w-[106px] px-[18px] py-3 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none ${ok ? "milo-pop" : ""}`}
      style={
        invertido
          ? { backgroundColor: "#B0CEFE", color: "#7A303B", fontWeight: 700 }
          : { backgroundColor: "#7A303B", color: "#FEFAEF" }
      }
    >
      {ok ? "✓ Sumado" : "Sumar"}
    </button>
  );
}
