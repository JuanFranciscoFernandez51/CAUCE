"use client";

import { useState } from "react";
import { useCarrito } from "./carrito-store";
import { BZ } from "./bazar-shell";

/** Selector de cantidad + "Agregar al carrito" de la página de producto. */
export function AgregarControls({
  productoId,
  nombre,
  precio,
  foto,
  stock,
}: {
  productoId: string;
  nombre: string;
  precio: number;
  foto: string | null;
  stock: number;
}) {
  const { agregar } = useCarrito();
  const [cant, setCant] = useState(1);
  const max = Math.min(99, Math.max(1, stock || 99));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex items-center rounded-full border"
        style={{ borderColor: "var(--t-borde)" }}
      >
        <button
          type="button"
          onClick={() => setCant((c) => Math.max(1, c - 1))}
          className="h-11 w-11 text-lg"
          aria-label="Restar uno"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold">{cant}</span>
        <button
          type="button"
          onClick={() => setCant((c) => Math.min(max, c + 1))}
          className="h-11 w-11 text-lg"
          aria-label="Sumar uno"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => agregar({ productoId, nombre, precio, foto }, cant)}
        className="flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-md transition-transform hover:scale-[1.01]"
        style={{ backgroundColor: "var(--tpl, #3FA9A5)", minWidth: "12rem" }}
      >
        Agregar al carrito 🛒
      </button>
    </div>
  );
}
