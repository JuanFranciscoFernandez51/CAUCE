"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Field,
  Input,
  Spinner,
} from "@/components/ui";
import type { CustomFieldDef } from "@/lib/tenant";
import { CustomFieldsInputs, type CustomValues } from "./custom-fields";

export type ProductFormInitial = {
  id: string;
  name: string;
  priceArs: number | null;
  priceUsd: number | null;
  stock: number;
  minStock: number;
  talles: Record<string, number> | null;
  custom: CustomValues;
};

type TalleRow = { talle: string; cantidad: string };

/** Alta y edición de producto. Si viene `product`, hace PATCH; si no, POST. */
export function ProductForm({
  slug,
  customDefs,
  product,
}: {
  slug: string;
  customDefs: CustomFieldDef[];
  product?: ProductFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [priceArs, setPriceArs] = useState(product?.priceArs != null ? String(product.priceArs) : "");
  const [priceUsd, setPriceUsd] = useState(product?.priceUsd != null ? String(product.priceUsd) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(product?.minStock ?? 0));
  const [talles, setTalles] = useState<TalleRow[]>(
    product?.talles
      ? Object.entries(product.talles).map(([talle, cantidad]) => ({ talle, cantidad: String(cantidad) }))
      : []
  );
  const usaTalles = talles.length > 0;
  const stockPorTalles = talles.reduce((s, t) => s + (Number.parseInt(t.cantidad || "0", 10) || 0), 0);
  const [custom, setCustom] = useState<CustomValues>(product?.custom ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function parsePrice(raw: string): number | null | undefined {
    if (raw.trim() === "") return null;
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return undefined; // inválido
    return n;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const ars = parsePrice(priceArs);
    const usd = parsePrice(priceUsd);
    if (ars === undefined || usd === undefined) {
      setError("Revisá los precios: tienen que ser números positivos");
      return;
    }
    const stockN = Number.parseInt(stock || "0", 10);
    const minStockN = Number.parseInt(minStock || "0", 10);
    if (!Number.isInteger(stockN) || stockN < 0 || !Number.isInteger(minStockN) || minStockN < 0) {
      setError("Stock y mínimo tienen que ser enteros positivos");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const url = product
        ? `/api/os/${slug}/products/${product.id}`
        : `/api/os/${slug}/products`;
      const res = await fetch(url, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          priceArs: ars,
          priceUsd: usd,
          stock: usaTalles ? stockPorTalles : stockN,
          minStock: minStockN,
          talles: usaTalles
            ? Object.fromEntries(
                talles
                  .filter((t) => t.talle.trim())
                  .map((t) => [t.talle.trim().toUpperCase(), Number.parseInt(t.cantidad || "0", 10) || 0])
              )
            : null,
          custom,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar el producto");
      router.push(`/os/${slug}/catalogo`);
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
        <Field label="Nombre *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Remera oversize negra"
            required
            autoFocus
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio (ARS)" help="Dejalo vacío si no aplica.">
            <Input
              value={priceArs}
              onChange={(e) => setPriceArs(e.target.value)}
              placeholder="25000"
              inputMode="decimal"
            />
          </Field>
          <Field label="Precio (USD)" help="Dejalo vacío si no aplica.">
            <Input
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="20"
              inputMode="decimal"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={usaTalles ? "Stock (suma de talles)" : "Stock"}
            help={usaTalles ? "Se calcula solo con los talles de abajo." : undefined}
          >
            <Input
              type="number"
              min={0}
              step={1}
              value={usaTalles ? String(stockPorTalles) : stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={usaTalles}
            />
          </Field>
          <Field label="Stock mínimo" help="Si el stock baja de acá, te avisamos con un badge.">
            <Input
              type="number"
              min={0}
              step={1}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </Field>
        </div>

        {/* Stock por talle (ropa, cascos, calzado): cada talle con su cantidad. */}
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Stock por talle</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTalles((ts) => [...ts, { talle: "", cantidad: "0" }])}
            >
              + Talle
            </Button>
          </div>
          {talles.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Solo si el producto viene por talle (ropa, cascos). Si no, usá el stock de arriba.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {talles.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={t.talle}
                    onChange={(e) =>
                      setTalles((ts) => ts.map((x, j) => (j === i ? { ...x, talle: e.target.value } : x)))
                    }
                    placeholder="S / M / 42…"
                    className="w-28"
                    aria-label={`Talle ${i + 1}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={t.cantidad}
                    onChange={(e) =>
                      setTalles((ts) => ts.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))
                    }
                    className="w-24"
                    aria-label={`Cantidad talle ${t.talle || i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTalles((ts) => ts.filter((_, j) => j !== i))}
                    aria-label={`Quitar talle ${t.talle || i + 1}`}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <CustomFieldsInputs defs={customDefs} values={custom} onChange={setCustom} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </Button>
          <ButtonLink href={`/os/${slug}/catalogo`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
