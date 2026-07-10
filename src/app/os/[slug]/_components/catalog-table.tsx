"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, ErrorState, Table, Td, Th } from "@/components/ui";
import { fmtArs, fmtUsd } from "./money";

export type CatalogProduct = {
  id: string;
  name: string;
  priceArs: number | null;
  priceUsd: number | null;
  stock: number;
  minStock: number;
  talles: Record<string, number> | null;
  active: boolean;
};

/**
 * Lista de productos con edición INLINE de stock (guardado al blur/Enter,
 * optimista con rollback) y toggle de activo. Borrar con confirm().
 */
export function CatalogTable({
  slug,
  products,
  searching,
}: {
  slug: string;
  products: CatalogProduct[];
  searching: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Re-sincronizar cuando el server manda props nuevas (búsqueda, refresh).
  const [prevProducts, setPrevProducts] = useState(products);
  if (products !== prevProducts) {
    setPrevProducts(products);
    setRows(products);
    setDrafts({});
  }

  async function patch(id: string, data: Record<string, unknown>): Promise<boolean> {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo guardar el cambio");
      }
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function commitStock(p: CatalogProduct) {
    const raw = drafts[p.id];
    if (raw === undefined) return;
    const next = Number.parseInt(raw, 10);
    setDrafts((d) => {
      const { [p.id]: _omit, ...rest } = d;
      return rest;
    });
    if (!Number.isInteger(next) || next < 0 || next === p.stock) return;

    const prev = p.stock;
    // Optimista: actualizo la fila ya mismo, rollback si falla.
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, stock: next } : r)));
    const ok = await patch(p.id, { stock: next });
    if (!ok) {
      setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, stock: prev } : r)));
    }
  }

  async function toggleActive(p: CatalogProduct) {
    const next = !p.active;
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, active: next } : r)));
    const ok = await patch(p.id, { active: next });
    if (!ok) {
      setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, active: !next } : r)));
    }
  }

  async function remove(p: CatalogProduct) {
    if (!confirm(`¿Borrar “${p.name}”? Esta acción no se puede deshacer.`)) return;
    setBusyId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo borrar el producto");
      }
      setRows((rs) => rs.filter((r) => r.id !== p.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title={searching ? "No encontramos productos con ese nombre" : "Todavía no cargaste productos"}
        detail={
          searching
            ? "Probá con otra búsqueda."
            : "Cargá tu primer producto y empezá a controlar precios y stock desde acá."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <Table>
        <thead>
          <tr>
            <Th>Producto</Th>
            <Th>Precio</Th>
            <Th>Stock</Th>
            <Th className="hidden sm:table-cell">Mínimo</Th>
            <Th>Activo</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const busy = busyId === p.id;
            const low = p.stock <= p.minStock;
            return (
              <tr key={p.id} className={busy ? "opacity-60" : ""}>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/os/${slug}/catalogo/${p.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    {!p.active ? <Badge variant="default">Inactivo</Badge> : null}
                  </div>
                </Td>
                <Td className="whitespace-nowrap tabular-nums">
                  {p.priceArs !== null ? <span>{fmtArs(p.priceArs)}</span> : null}
                  {p.priceArs !== null && p.priceUsd !== null ? (
                    <span className="text-muted-foreground"> · </span>
                  ) : null}
                  {p.priceUsd !== null ? (
                    <span className="text-muted-foreground">{fmtUsd(p.priceUsd)}</span>
                  ) : null}
                  {p.priceArs === null && p.priceUsd === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : null}
                </Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.talles ? (
                      // Con talles, el total se edita entrando al producto.
                      <Link
                        href={`/os/${slug}/catalogo/${p.id}`}
                        title="Editar stock por talle"
                        className="flex flex-wrap items-center gap-1"
                      >
                        {Object.entries(p.talles).map(([t, n]) => (
                          <span
                            key={t}
                            className={`rounded border px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                              n === 0 ? "text-destructive" : ""
                            }`}
                          >
                            {t}:{n}
                          </span>
                        ))}
                      </Link>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={drafts[p.id] ?? String(p.stock)}
                        onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        onBlur={() => commitStock(p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") {
                            setDrafts((d) => {
                              const { [p.id]: _omit, ...rest } = d;
                              return rest;
                            });
                          }
                        }}
                        disabled={busy}
                        aria-label={`Stock de ${p.name}`}
                        className="h-8 w-16 rounded-md border border-input bg-card px-2 text-sm tabular-nums text-card-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                      />
                    )}
                    {low ? <Badge variant="warning">Stock bajo</Badge> : null}
                  </div>
                </Td>
                <Td className="hidden tabular-nums text-muted-foreground sm:table-cell">
                  {p.minStock}
                </Td>
                <Td>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.active}
                    aria-label={`${p.active ? "Desactivar" : "Activar"} ${p.name}`}
                    onClick={() => toggleActive(p)}
                    disabled={busy}
                    className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
                      p.active ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all ${
                        p.active ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <Link
                      href={`/os/${slug}/catalogo/${p.id}`}
                      className="inline-flex h-7 items-center rounded border bg-card px-2 text-xs font-medium hover:bg-muted"
                    >
                      Editar
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive"
                      onClick={() => remove(p)}
                      disabled={busy}
                    >
                      Borrar
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
