"use client";

import { useState } from "react";
import { BZ } from "./bazar-shell";

/**
 * Formulario de consulta del bazar (general o por producto).
 * POST /api/public/sitio/[slug]/bazar-consulta → BazarConsulta + lead en el CRM.
 */
export function ConsultaBazarForm({
  slug,
  productoId,
  productoNombre,
}: {
  slug: string;
  productoId?: string;
  productoNombre?: string;
}) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState(
    productoNombre ? `Hola, quiero consultar por "${productoNombre}".` : ""
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return setError("Decinos tu nombre");
    if (contacto.trim().length < 6) return setError("Dejanos un teléfono o email válido");
    if (!mensaje.trim()) return setError("Contanos qué querés consultar");
    setEnviando(true);
    try {
      const res = await fetch(`/api/public/sitio/${slug}/bazar-consulta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          mensaje: mensaje.trim(),
          productoId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar la consulta");
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#3FA9A5]";

  if (listo) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--t-suave)", border: `1px solid ${"var(--t-borde)"}` }}
      >
        <div className="text-4xl">✨</div>
        <h3 className="mt-3 text-xl font-bold" style={{ color: "var(--t-texto)" }}>
          ¡Consulta enviada!
        </h3>
        <p className="mt-1 text-sm t-tenue">
          Gracias {nombre.split(" ")[0]}. Te respondemos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre y apellido"
          required
          className={campo}
          style={{ borderColor: "var(--t-borde)" }}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Teléfono o email *</label>
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="Ej: 291 555 5555"
          required
          className={campo}
          style={{ borderColor: "var(--t-borde)" }}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Mensaje *</label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={4}
          placeholder="Contanos qué estás buscando…"
          required
          className={`${campo} min-h-24`}
          style={{ borderColor: "var(--t-borde)" }}
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "var(--tpl, #3FA9A5)", color: "var(--tpl-sobre, #fff)" }}
      >
        {enviando ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
