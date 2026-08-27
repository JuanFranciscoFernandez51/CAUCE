"use client";

import { useState } from "react";

/** Formulario de la landing de vidrios: la consulta cae directo al CRM (patrón piletas). */
export function VidriosConsulta({ slug }: { slug: string }) {
  const [f, setF] = useState({ nombre: "", telefono: "", mensaje: "" });
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const r = await fetch(`/api/public/sitio/${slug}/consulta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setEstado(r.ok ? "ok" : "error");
  }

  const campo =
    "w-full rounded-lg border bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-[#008000]";
  const borde = { borderColor: "#cfe3cf" };

  if (estado === "ok")
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-3xl" aria-hidden>✅</p>
        <p className="mt-3 text-xl font-bold" style={{ color: "#0c1f0c" }}>
          ¡Recibimos tu consulta!
        </p>
        <p className="mt-1.5 text-[15px]" style={{ color: "#3c553c" }}>
          Te contactamos a la brevedad para cotizarte el vidrio.
        </p>
      </div>
    );

  return (
    <form onSubmit={enviar} className="grid content-start gap-3.5">
      <label className="grid gap-1.5 text-[13px] font-semibold" style={{ color: "#0c1f0c" }}>
        Nombre
        <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required className={campo} style={borde} placeholder="Tu nombre" />
      </label>
      <label className="grid gap-1.5 text-[13px] font-semibold" style={{ color: "#0c1f0c" }}>
        Teléfono
        <input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} required className={campo} style={borde} placeholder="291 …" />
      </label>
      <label className="grid gap-1.5 text-[13px] font-semibold" style={{ color: "#0c1f0c" }}>
        ¿Qué necesitás?
        <textarea
          value={f.mensaje}
          onChange={(e) => setF({ ...f, mensaje: e.target.value })}
          rows={4}
          className={campo}
          style={borde}
          placeholder="Marca y modelo del auto, qué vidrio se rompió, si es por seguro…"
        />
      </label>
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-1 rounded-lg px-8 py-3.5 text-[14px] font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: "#008000" }}
      >
        {estado === "enviando" ? "Enviando…" : "Pedir cotización"}
      </button>
      {estado === "error" ? (
        <p className="text-sm text-red-700">No se pudo enviar. Probá de nuevo en un rato.</p>
      ) : null}
    </form>
  );
}
