"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";

export type ProcesoData = {
  id: string;
  nombre: string;
  queHace: string;
  cuando: string;
  estado: "ACTIVO" | "PAUSADO";
  ultimaCorrida: string | null;
};

/**
 * El proceso del cliente, en una lista simple: qué corre, cuándo y qué resuelve.
 * Editable acá mismo (pausar, corregir textos, sumar o borrar) sin pantallas extra.
 */
export function ProcesosSection({
  clientId,
  procesos: initial,
}: {
  clientId: string;
  procesos: ProcesoData[];
}) {
  const router = useRouter();
  const [procesos, setProcesos] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: "", queHace: "", cuando: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(p: ProcesoData) {
    const estado = p.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO";
    const prev = procesos;
    setProcesos((ps) => ps.map((x) => (x.id === p.id ? { ...x, estado } : x)));
    const res = await fetch(`/api/admin/procesos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) setProcesos(prev);
    else router.refresh();
  }

  async function remove(p: ProcesoData) {
    if (!confirm(`¿Borrar el proceso "${p.nombre}"?`)) return;
    const prev = procesos;
    setProcesos((ps) => ps.filter((x) => x.id !== p.id));
    const res = await fetch(`/api/admin/procesos/${p.id}`, { method: "DELETE" });
    if (!res.ok) setProcesos(prev);
    else router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/procesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...form }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      setProcesos((ps) => [...ps, { ...data.proceso, ultimaCorrida: null }]);
      setForm({ nombre: "", queHace: "", cuando: "" });
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Su proceso, cómo está armado</h2>
          <p className="text-sm text-muted-foreground">
            Lo que corre solo en su sistema, en criollo. Esto mismo ve el cliente.
          </p>
        </div>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            + Proceso
          </Button>
        ) : null}
      </div>

      {adding ? (
        <form onSubmit={add} className="mb-5 grid gap-3 rounded-md border p-4 sm:grid-cols-3">
          <Field label="Nombre" help='Ej: "Recordatorio de service"'>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Field>
          <Field label="Qué hace" help="En criollo, como se lo contás al dueño.">
            <Input value={form.queHace} onChange={(e) => setForm({ ...form, queHace: e.target.value })} required />
          </Field>
          <Field label="Cuándo corre" help='Ej: "Todos los días a las 9:00"'>
            <Input value={form.cuando} onChange={(e) => setForm({ ...form, cuando: e.target.value })} required />
          </Field>
          {error ? (
            <div className="sm:col-span-3">
              <ErrorState message={error} />
            </div>
          ) : null}
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? <Spinner /> : null} Agregar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setError(""); }}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {procesos.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Sin procesos cargados. Agregá el primero con &quot;+ Proceso&quot;.
        </p>
      ) : (
        <ul className="divide-y">
          {procesos.map((p) => {
            const activo = p.estado === "ACTIVO";
            return (
              <li key={p.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activo ? "bg-success" : "bg-muted-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p.nombre}</p>
                    <Badge variant={activo ? "success" : "default"}>
                      {activo ? "Funcionando" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.queHace}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Corre: {p.cuando}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggle(p)}>
                    {activo ? "Pausar" : "Reactivar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p)}>
                    Borrar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
