"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MARCAS_MOTO, modelosDe, nombreMoto } from "@/lib/motos-ar";

/**
 * "Elegí tu moto" — el corazón del shop. El cliente no sabe el código del
 * repuesto: sabe qué moto tiene. Manda a /tienda?moto=<Marca Modelo>, que
 * filtra por compatibilidad.
 */
export function BuscadorMoto({ base }: { base: string }) {
  const router = useRouter();
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [texto, setTexto] = useState("");

  const modelos = marca ? modelosDe(marca) : [];

  const buscarPorMoto = () => {
    if (!modelo) return;
    router.push(`${base}/tienda?moto=${encodeURIComponent(modelo)}`);
  };

  const sel =
    "h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-[#F5B301] disabled:opacity-40";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md sm:p-5">
      <p className="mb-3 text-sm font-semibold text-[#F5B301]">Buscá el repuesto para tu moto</p>

      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
        <select
          value={marca}
          onChange={(e) => { setMarca(e.target.value); setModelo(""); }}
          className={sel}
          aria-label="Marca de tu moto"
        >
          <option value="">Marca…</option>
          {MARCAS_MOTO.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          disabled={!marca}
          className={sel}
          aria-label="Modelo de tu moto"
        >
          <option value="">{marca ? "Modelo…" : "Elegí la marca"}</option>
          {modelos.map((m) => (
            <option key={m.modelo} value={nombreMoto(m)}>{m.modelo}</option>
          ))}
        </select>

        <button
          onClick={buscarPorMoto}
          disabled={!modelo}
          className="h-12 rounded-xl bg-[#F5B301] px-6 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ver repuestos
        </button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (texto.trim()) router.push(`${base}/tienda?q=${encodeURIComponent(texto.trim())}`); }}
        className="mt-2.5 flex gap-2.5"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="…o buscá por nombre o código: cadena, pastillas, batería…"
          className="h-12 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#F5B301]"
          aria-label="Buscar repuesto por nombre o código"
        />
        <button type="submit" className="h-12 rounded-xl border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10">
          Buscar
        </button>
      </form>

      <p className="mt-3 text-xs text-white/50">
        ¿No encontrás tu modelo? Escribinos y lo verificamos antes de despachar.
      </p>
    </div>
  );
}
