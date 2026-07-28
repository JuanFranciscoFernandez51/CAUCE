"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtKm, fmtPrecioVehiculo } from "@/lib/conce";
import { RC } from "./conce-shell";
import { leerFavoritos } from "./ficha-acciones";

/**
 * Lista de favoritos: lee los IDs de localStorage y trae los datos frescos
 * del stock por la API pública (precio/estado siempre al día).
 */

type Fav = {
  id: string;
  slug: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  estado: string;
  foto: string | null;
};

export function FavoritosList({ slug }: { slug: string }) {
  const base = `/sitio/${slug}`;
  const [cargando, setCargando] = useState(true);
  const [favs, setFavs] = useState<Fav[]>([]);

  useEffect(() => {
    const ids = leerFavoritos(slug);
    if (ids.length === 0) {
      setCargando(false);
      return;
    }
    fetch(`/api/public/sitio/${slug}/conce-vehiculos?ids=${encodeURIComponent(ids.join(","))}`)
      .then((r) => r.json())
      .then((data: { vehiculos?: Fav[] }) => setFavs(data.vehiculos ?? []))
      .catch(() => setFavs([]))
      .finally(() => setCargando(false));
  }, [slug]);

  function quitar(id: string) {
    const ids = leerFavoritos(slug).filter((x) => x !== id);
    try {
      localStorage.setItem(`rc-favoritos-${slug}`, JSON.stringify(ids));
    } catch {
      // seguimos igual
    }
    setFavs((prev) => prev.filter((f) => f.id !== id));
  }

  if (cargando) {
    return <p className="py-16 text-center text-sm text-gray-500">Cargando tus favoritos…</p>;
  }

  if (favs.length === 0) {
    return (
      <div
        className="rounded-[2.5rem] bg-white px-6 py-16 text-center"
        style={{ border: `1px solid ${RC.borde}` }}
      >
        <div className="text-5xl">🤍</div>
        <p className="mt-3 text-lg font-bold">Todavía no marcaste favoritos</p>
        <p className="mt-1 text-sm text-gray-500">
          Tocá el corazón en la ficha de cualquier vehículo y aparece acá.
        </p>
        <Link
          href={`${base}/catalogo`}
          className="mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-bold"
          style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
        >
          Explorar el catálogo
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {favs.map((f) => (
        <li
          key={f.id}
          className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm"
          style={{ border: `1px solid ${RC.borde}` }}
        >
          <Link href={`${base}/vehiculo/${f.slug}`} className="shrink-0">
            {f.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.foto} alt="" className="h-20 w-28 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-20 w-28 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: RC.doradoSuave }}>
                🚗
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`${base}/vehiculo/${f.slug}`} className="hover:underline">
              <p className="truncate font-bold">
                {f.marca} {f.modelo} {f.version ?? ""}
              </p>
            </Link>
            <p className="text-sm text-gray-500">
              {f.anio} · {f.condicion === "0km" ? "0 km" : fmtKm(f.km)}
              {f.estado === "reservado" ? " · Reservado" : ""}
            </p>
            <p className="mt-0.5 font-extrabold" style={{ color: RC.doradoTexto }}>
              {fmtPrecioVehiculo(f.precio, f.moneda)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => quitar(f.id)}
            className="shrink-0 rounded-full px-3 py-2 text-sm text-gray-400 hover:text-red-500"
            title="Quitar de favoritos"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
