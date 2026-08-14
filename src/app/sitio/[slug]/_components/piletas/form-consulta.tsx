"use client";

import { useState } from "react";

/** El formulario de la landing: la consulta cae directo al CRM del negocio. */
export function FormConsulta({ slug }: { slug: string }) {
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
    "w-full border-0 border-b bg-transparent px-0 py-2.5 text-[15px] outline-none transition focus:border-[#17827A]";
  const borde = { borderColor: "#E3E0D6", borderBottomWidth: 1, borderBottomStyle: "solid" as const };

  if (estado === "ok")
    return (
      <div className="flex flex-col items-start justify-center gap-2 p-4" style={borde}>
        <p className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-cormorant)", color: "#14201E" }}>
          Recibimos tu consulta
        </p>
        <p className="text-[15px]" style={{ color: "#4C5C58" }}>
          Te contactamos hoy mismo por WhatsApp.
        </p>
      </div>
    );

  return (
    <form onSubmit={enviar} className="grid content-start gap-3">
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#8A8674" }}>
        Nombre
        <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required className={`${campo} mt-1.5`} style={borde} />
      </label>
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#8A8674" }}>
        Teléfono
        <input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} required className={`${campo} mt-1.5`} style={borde} />
      </label>
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#8A8674" }}>
        Qué necesitás
        <textarea value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} rows={4} className={`${campo} mt-1.5`} style={borde} />
      </label>
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-2 px-8 py-4 text-[14px] font-semibold uppercase tracking-[0.1em] transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#14201E", color: "#F5F1E8" }}
      >
        {estado === "enviando" ? "Enviando…" : "Enviar consulta"}
      </button>
      {estado === "error" ? <p className="text-sm text-red-700">No se pudo enviar. Probá por WhatsApp.</p> : null}
    </form>
  );
}
