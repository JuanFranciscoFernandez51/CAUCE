"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

/** Alta rápida de proveedor: cuatro datos y adentro. El resto va en la ficha. */
export function ProveedorNuevo({ slug }: { slug: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: "", rubro: "", cuit: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          rubro: form.rubro.trim() || undefined,
          cuit: form.cuit.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { proveedor?: { id: string }; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      if (data?.proveedor?.id) {
        router.push(`/os/${slug}/proveedores/${data.proveedor.id}`);
        return;
      }
      setForm({ nombre: "", rubro: "", cuit: "", telefono: "" });
      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Nuevo proveedor
      </button>
    );
  }

  return (
    <Card className="w-full p-4">
      <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Nombre / razón social">
          <Input
            autoFocus
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Autopartes del Sur SRL"
          />
        </Field>
        <Field label="Rubro">
          <Input
            value={form.rubro}
            onChange={(e) => setForm({ ...form, rubro: e.target.value })}
            placeholder="Repuestos, seguros, gestoría…"
          />
        </Field>
        <Field label="CUIT">
          <Input
            value={form.cuit}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            placeholder="30-12345678-9"
          />
        </Field>
        <Field label="Teléfono">
          <Input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="291 5..."
          />
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={guardando || !form.nombre.trim()}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancelar
          </button>
        </div>
        {error ? <p className="text-sm text-destructive lg:col-span-5">{error}</p> : null}
      </form>
    </Card>
  );
}
