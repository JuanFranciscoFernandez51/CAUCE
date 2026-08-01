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

  if (false) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
        Este repuesto lo pedimos al proveedor: se consigue en 5 a 10 días. Agregalo igual y lo gestionamos.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex items-center rounded-full border"
        style={{ borderColor: BZ.aquaClaro }}
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
        style={{ backgroundColor: BZ.aqua, minWidth: "12rem" }}
      >
        Agregar al carrito 🛒
      </button>
    </div>
  );
}
