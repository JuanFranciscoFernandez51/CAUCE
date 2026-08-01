"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MARCAS_MOTO, modelosDe, nombreMoto } from "@/lib/motos-ar";

/**
 * "Elegí tu moto" — el corazón del shop. El cliente no sabe el código del
 * repuesto: sabe qué moto tiene. Manda a /tienda?moto=<Marca Modelo>.
 */
const POPULARES = [
  "Honda Wave 110 S",
  "Honda CG 150 Titan",
  "Gilera Smash 110",
  "Motomel Blitz 110",
  "Yamaha YBR125",
  "Corven Energy 110",
];

export function BuscadorMoto({ base, total }: { base: string; total?: number }) {
  const router = useRouter();
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [texto, setTexto] = useState("");

  const modelos = marca ? modelosDe(marca) : [];
  const irA = (m: string) => router.push(`${base}/tienda?moto=${encodeURIComponent(m)}`);

  const campo =
    "peer h-[52px] w-full appearance-none rounded-xl border border-white/15 bg-white/[0.06] px-4 pr-9 text-[15px] text-white outline-none transition focus:border-[#F5B301] focus:bg-white/[0.09] disabled:opacity-35";

  return (
    <div className="relative">
      {/* halo cálido detrás de la tarjeta */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(60% 60% at 70% 20%, rgba(245,179,1,.28), transparent 70%)" }}
      />
      <div className="rounded-[26px] border border-white/12 bg-[#141414]/85 p-5 shadow-[0_24px_70px_-24px_rgba(0,0,0,.9)] backdrop-blur-xl sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-bold text-white">Buscá el repuesto para tu moto</p>
          {total ? (
            <span className="rounded-full bg-[#F5B301]/15 px-2.5 py-1 text-[11px] font-bold text-[#F5B301]">
              {total.toLocaleString("es-AR")} repuestos
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <label className="relative block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">Marca</span>
            <select value={marca} onChange={(e) => { setMarca(e.target.value); setModelo(""); }} className={campo}>
              <option value="">Elegí la marca…</option>
              {MARCAS_MOTO.map((m) => (
                <option key={m} value={m} className="bg-[#141414]">{m}</option>
              ))}
            </select>
            <Flecha />
          </label>

          <label className="relative block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45">Modelo</span>
            <select value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={!marca} className={campo}>
              <option value="">{marca ? "Elegí el modelo…" : "Primero la marca"}</option>
              {modelos.map((m) => (
                <option key={m.nombre} value={nombreMoto(m)} className="bg-[#141414]">{m.modelo}</option>
              ))}
            </select>
            <Flecha />
          </label>
        </div>

        <button
          onClick={() => modelo && irA(modelo)}
          disabled={!modelo}
          className="mt-3 h-[52px] w-full rounded-xl bg-[#F5B301] text-[15px] font-bold text-black transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
        >
          {modelo ? `Ver repuestos para tu ${modelo}` : "Ver repuestos"}
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/35">o buscá directo</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (texto.trim()) router.push(`${base}/tienda?q=${encodeURIComponent(texto.trim())}`); }}
          className="flex gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cadena, pastillas, batería, código…"
            className="h-[52px] flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-[#F5B301] focus:bg-white/[0.09]"
            aria-label="Buscar repuesto por nombre o código"
          />
          <button type="submit" className="h-[52px] rounded-xl border border-white/20 px-5 text-[15px] font-semibold text-white transition hover:bg-white/10">
            Buscar
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-white/35">Las más buscadas</span>
          {POPULARES.map((m) => (
            <button
              key={m}
              onClick={() => irA(m)}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-[#F5B301]/60 hover:bg-[#F5B301]/10 hover:text-white"
            >
              {m.replace(/^(Honda|Gilera|Motomel|Yamaha|Corven) /, "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Flecha() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute bottom-[18px] right-3.5 h-4 w-4 text-white/40 peer-focus:text-[#F5B301]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
