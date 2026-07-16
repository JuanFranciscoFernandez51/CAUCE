"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";

/** Ingreso al taller: cliente + equipo + motivo. Tres campos y adentro. */
export function IngresoForm({ slug }: { slug: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [nombre, setNombre] = useState(sp.get("nombre") ?? "");
  const [telefono, setTelefono] = useState(sp.get("telefono") ?? "");
  const [equipo, setEquipo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/taller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          equipo: equipo.trim(),
          motivoIngreso: motivo.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el ingreso");
      router.push(`/os/${slug}/taller/${data.id}`);
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
          <Field label="WhatsApp" help="Para avisarle cuando esté lista.">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
        </div>
        <Field label="Equipo *" help="Qué entra: moto, bici, máquina… con patente o detalle.">
          <Input
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            placeholder="Vespa Primavera 150 · AB123CD"
            required
          />
        </Field>
        <Field label="Motivo de ingreso *">
          <Textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Service de los 10.000 km / no arranca / ruido en la rueda…"
            required
          />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "Ingresar al taller"}
          </Button>
          <ButtonLink href={`/os/${slug}/taller`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
