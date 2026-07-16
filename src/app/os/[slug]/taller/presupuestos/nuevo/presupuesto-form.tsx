"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";

/** Alta de presupuesto: cliente + equipo + qué cotizar. */
export function PresupuestoForm({ slug }: { slug: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [nombre, setNombre] = useState(sp.get("nombre") ?? "");
  const [telefono, setTelefono] = useState(sp.get("telefono") ?? "");
  const [equipo, setEquipo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/presupuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          equipo: equipo.trim(),
          detalle: detalle.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      router.push(`/os/${slug}/taller/presupuestos/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <ErrorState message={error} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente *">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </Field>
          <Field label="WhatsApp" help="Para mandarle el presupuesto directo.">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
        </div>
        <Field label="Equipo *">
          <Input
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            placeholder="Vespa GTS 300 · AB123CD"
            required
          />
        </Field>
        <Field label="Qué hay que cotizar *">
          <Textarea
            rows={3}
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Service completo + cubierta trasera…"
            required
          />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "Crear presupuesto"}
          </Button>
          <ButtonLink href={`/os/${slug}/taller/presupuestos`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
