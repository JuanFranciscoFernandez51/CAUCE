"use client";

import Link from "next/link";
import { fmtPrecio, precioVigente } from "@/lib/bazar";
import type { BazarCardData } from "../../_lib/bazar-site";
import { useCarrito } from "./carrito-store";
import { BZ } from "./bazar-shell";

/**
 * Card de producto de la tienda: foto, badges (NUEVO / ¡Últimas unidades! /
 * Sin stock), precio con oferta tachada y "Agregar" rápido sin salir de la grilla.
 */
export function ProductoCard({ slug, p }: { slug: string; p: BazarCardData }) {
  const { agregar } = useCarrito();
  const vigente = precioVigente(p);
  const sinStock = p.stock <= 0;
  const ultimas = p.stock >= 1 && p.stock <= 3;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg"
      style={{ borderColor: "#E8F2F1" }}
    >
      <Link href={`/sitio/${slug}/producto/${p.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: BZ.arena }}>
          {p.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.foto}
              alt={p.nombre}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${sinStock ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <div className="emoji-tpl flex h-full w-full items-center justify-center text-4xl" aria-hidden />
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {p.esNuevo && !sinStock ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: "var(--tpl-oscuro, " + BZ.azul + ")" }}
              >
                NUEVO
              </span>
            ) : null}
            {ultimas ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                ¡Últimas unidades!
              </span>
            ) : null}
            {sinStock ? (
              <span className="rounded-full bg-gray-400 px-2 py-0.5 text-[11px] font-bold text-white">
                Sin stock
              </span>
            ) : null}
            {p.precioOferta != null && p.precioOferta < p.precio && !sinStock ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: "var(--tpl, " + BZ.aqua + ")", color: "var(--tpl-sobre, #fff)" }}
              >
                OFERTA
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/sitio/${slug}/producto/${p.slug}`} className="block flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{p.nombre}</p>
        </Link>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            {p.precioOferta != null && p.precioOferta < p.precio ? (
              <p className="text-xs text-gray-400 line-through">{fmtPrecio(p.precio)}</p>
            ) : null}
            <p className="text-base font-bold" style={{ color: "var(--tpl-texto, " + BZ.azul + ")" }}>
              {fmtPrecio(vigente)}
            </p>
          </div>
          {!sinStock ? (
            <button
              type="button"
              onClick={() =>
                agregar({ productoId: p.id, nombre: p.nombre, precio: vigente, foto: p.foto })
              }
              aria-label={`Agregar ${p.nombre} al carrito`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
              style={{ backgroundColor: "var(--tpl, " + BZ.aqua + ")", color: "var(--tpl-sobre, #fff)" }}
            >
              +
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
