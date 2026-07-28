"use client";

import { useEffect, useState } from "react";
import { RC } from "./conce-shell";

/**
 * Acciones client de la ficha del vehículo:
 * - VistaPing: suma la visita real (alimenta el TOP del dashboard).
 * - FavoritoBtn: corazón con localStorage (sin cuenta, al toque).
 * - CompartirBtn: share nativo o copiar link.
 */

export function VistaPing({ slug, vehiculoId }: { slug: string; vehiculoId: string }) {
  useEffect(() => {
    const KEY = `rc-vista-${vehiculoId}`;
    try {
      if (sessionStorage.getItem(KEY)) return; // 1 visita por sesión
      sessionStorage.setItem(KEY, "1");
    } catch {
      // sin sessionStorage la contamos igual
    }
    fetch(`/api/public/sitio/${slug}/conce-vista`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehiculoId }),
    }).catch(() => {});
  }, [slug, vehiculoId]);
  return null;
}

const FAVS_KEY = (slug: string) => `rc-favoritos-${slug}`;

export function leerFavoritos(slug: string): string[] {
  try {
    const raw = localStorage.getItem(FAVS_KEY(slug));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function FavoritoBtn({ slug, vehiculoId }: { slug: string; vehiculoId: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    setFav(leerFavoritos(slug).includes(vehiculoId));
  }, [slug, vehiculoId]);

  function toggle() {
    const favs = leerFavoritos(slug);
    const nuevas = favs.includes(vehiculoId)
      ? favs.filter((id) => id !== vehiculoId)
      : [...favs, vehiculoId];
    try {
      localStorage.setItem(FAVS_KEY(slug), JSON.stringify(nuevas));
    } catch {
      // igual actualizamos el estado visual
    }
    setFav(nuevas.includes(vehiculoId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2.5 text-sm font-semibold transition-colors"
      style={{ borderColor: fav ? "#EF4444" : RC.borde, color: fav ? "#EF4444" : "#111" }}
    >
      {fav ? "❤️ En favoritos" : "🤍 Favorito"}
    </button>
  );
}

export function CompartirBtn({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url });
        return;
      }
    } catch {
      // canceló el share nativo → probamos copiar
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // último recurso: nada
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
      style={{ borderColor: RC.borde }}
    >
      {copiado ? "✅ Link copiado" : "🔗 Compartir"}
    </button>
  );
}
