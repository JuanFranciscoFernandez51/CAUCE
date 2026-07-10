"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtArs } from "../../_components/money";

/** Alta de venta: comprador + qué + números. El saldo se calcula en vivo. */
export function VentaForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [sena, setSena] = useState("");
  const [permutaDetalle, setPermutaDetalle] = useState("");
  const [permutaValor, setPermutaValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saldo = (Number(precio) || 0) - (Number(sena) || 0) - (Number(permutaValor) || 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          descripcion: descripcion.trim(),
          precioArs: Number(precio) || 0,
          senaArs: Number(sena) || 0,
          permutaDetalle: permutaDetalle.trim(),
          permutaValorArs: Number(permutaValor) || 0,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear la venta");
      router.push(`/os/${slug}/ventas/${data.id}`);
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
          <Field label="Comprador *">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </Field>
          <Field label="WhatsApp">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
        </div>
        <Field label="Qué se vende *">
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Vespa Primavera 150 0km roja"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio (ARS) *">
            <Input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} required />
          </Field>
          <Field label="Seña (ARS)">
            <Input type="number" min={0} value={sena} onChange={(e) => setSena(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Permuta (qué entrega)" help="Si entrega algo en parte de pago.">
            <Input
              value={permutaDetalle}
              onChange={(e) => setPermutaDetalle(e.target.value)}
              placeholder="Zanella Styler 150 2019"
            />
          </Field>
          <Field label="Valor tomado (ARS)">
            <Input type="number" min={0} value={permutaValor} onChange={(e) => setPermutaValor(e.target.value)} />
          </Field>
        </div>
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          Saldo que queda: <span className="font-bold tabular-nums">{fmtArs(Math.max(0, saldo))}</span>
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "Crear venta"}
          </Button>
          <ButtonLink href={`/os/${slug}/ventas`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
