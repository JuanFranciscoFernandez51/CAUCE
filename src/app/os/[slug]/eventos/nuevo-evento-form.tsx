"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";

/** Alta de evento en una línea: nombre + fecha + categorías. */
export function NuevoEventoForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [categorias, setCategorias] = useState("General");
  const [cupo, setCupo] = useState("100");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!abierto) {
    return (
      <Button size="sm" onClick={() => setAbierto(true)}>
        + Evento
      </Button>
    );
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          fecha,
          lugar: lugar.trim(),
          categorias: categorias.split(",").map((c) => c.trim()).filter(Boolean),
          cupo: Number.parseInt(cupo || "100", 10),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el evento");
      router.push(`/os/${slug}/eventos/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre del evento *">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="2ª Gymkhana Oficial" required autoFocus />
        </Field>
        <Field label="Fecha *">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </Field>
        <Field label="Lugar">
          <Input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Plaza Shopping" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categorías" help="Separadas por coma.">
            <Input value={categorias} onChange={(e) => setCategorias(e.target.value)} />
          </Field>
          <Field label="Cupo">
            <Input type="number" min={1} max={1000} value={cupo} onChange={(e) => setCupo(e.target.value)} />
          </Field>
        </div>
        {error ? (
          <div className="sm:col-span-2">
            <ErrorState message={error} />
          </div>
        ) : null}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Spinner /> : null} Crear evento
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
