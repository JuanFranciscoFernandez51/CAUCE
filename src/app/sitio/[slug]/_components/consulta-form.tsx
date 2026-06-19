"use client";

import { useState } from "react";

/**
 * Formulario de consulta del sitio público. POST a /api/public/sitio/[slug]/consulta,
 * crea/vincula un Contact (lead) en el CRM del tenant. Estado de éxito lindo.
 */
export function ConsultaForm({
  slug,
  listingId,
  propTitle,
}: {
  slug: string;
  listingId?: string;
  propTitle?: string;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState(
    propTitle ? `Hola, quiero más información sobre "${propTitle}".` : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return setError("Decinos tu nombre");
    if (telefono.trim().length < 6) return setError("Dejanos un teléfono válido");
    setSaving(true);
    try {
      const res = await fetch(`/api/public/sitio/${slug}/consulta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim() || "",
          mensaje: mensaje.trim() || "",
          listingId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar la consulta");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  const fieldCls =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring";

  if (done) {
    return (
      <div className="rounded-xl border bg-primary-soft p-6 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="mt-2 text-lg font-semibold">¡Consulta enviada!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Gracias {nombre.split(" ")[0]}. Nos pondremos en contacto a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          className={fieldCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Teléfono / WhatsApp *</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: 291 555 5555"
          inputMode="tel"
          required
          className={fieldCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email (opcional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@email.com"
          className={fieldCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Mensaje</label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={4}
          placeholder="Contanos qué te interesa…"
          className={`${fieldCls} min-h-24`}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
