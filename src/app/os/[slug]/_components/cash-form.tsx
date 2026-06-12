"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";

/** Carga rápida de movimientos de caja: venta / gasto / ajuste. */
export function CashForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"venta" | "gasto" | "ajuste">("venta");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("efectivo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!concept.trim()) {
      setError("El concepto es obligatorio");
      return;
    }
    if (!Number.isFinite(n) || (kind === "ajuste" ? n === 0 : n <= 0)) {
      setError(
        kind === "ajuste"
          ? "El ajuste tiene que ser distinto de 0 (puede ser negativo)"
          : "El monto tiene que ser mayor a 0"
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          concept: concept.trim(),
          amountArs: n,
          method: method || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar el movimiento");
      setConcept("");
      setAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-end"
      >
        <Field label="Tipo">
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as "venta" | "gasto" | "ajuste")}
          >
            <option value="venta">Venta</option>
            <option value="gasto">Gasto</option>
            <option value="ajuste">Ajuste</option>
          </Select>
        </Field>
        <Field label="Concepto *">
          <Input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder={kind === "gasto" ? "Mercadería, alquiler…" : "Venta mostrador…"}
            required
          />
        </Field>
        <Field label="Monto (ARS) *" help={kind === "ajuste" ? "Puede ser negativo." : undefined}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="15000"
            inputMode="decimal"
            required
            className="sm:w-32"
          />
        </Field>
        <Field label="Medio">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="mp">Mercado Pago</option>
            <option value="transferencia">Transferencia</option>
          </Select>
        </Field>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner /> : null}
          {saving ? "Cargando…" : "Cargar"}
        </Button>
      </form>
      {error ? (
        <div className="mt-3">
          <ErrorState message={error} />
        </div>
      ) : null}
    </Card>
  );
}
