"use client";

import { useState } from "react";
import { RC } from "./conce-shell";

/**
 * Form de consulta del sitio de la concesionaria (general o por vehículo).
 * Crea la ConceConsulta para la bandeja del admin Y el lead en el CRM.
 */
export function ConsultaConceForm({
  slug,
  vehiculoId,
  vehiculoNombre,
}: {
  slug: string;
  vehiculoId?: string;
  vehiculoNombre?: string;
}) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState(
    vehiculoNombre ? `Hola! Quiero consultar por el ${vehiculoNombre}. ` : ""
  );
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setError("");
    try {
      const res = await fetch(`/api/public/sitio/${slug}/conce-consulta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, contacto, mensaje, vehiculoId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar");
      setEstado("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div
        className="rounded-3xl bg-white p-8 text-center"
        style={{ border: `1px solid ${RC.borde}` }}
      >
        <div className="text-4xl">✅</div>
        <p className="mt-3 text-lg font-bold">¡Recibimos tu consulta!</p>
        <p className="mt-1 text-sm text-gray-500">
          Te contactamos a la brevedad. Si es urgente, escribinos por WhatsApp al 291 503-8204.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-3 rounded-3xl bg-white p-6"
      style={{ border: `1px solid ${RC.borde}` }}
    >
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre *"
          required
          className="h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:border-[#D18E00]"
          style={{ borderColor: RC.borde }}
        />
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="Teléfono o email *"
          required
          className="h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:border-[#D18E00]"
          style={{ borderColor: RC.borde }}
        />
      </div>
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="¿Qué querés consultar? *"
        required
        rows={4}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#D18E00]"
        style={{ borderColor: RC.borde }}
      />
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="w-full rounded-full py-3 font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
      >
        {estado === "enviando" ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
