"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState, ErrorState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { fmtArs } from "../money";
import { primeraFoto } from "@/lib/bazar";

export type ProductoRow = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioOferta: number | null;
  stock: number;
  fotos: unknown;
  destacado: boolean;
  activo: boolean;
  sku: string | null;
  vendidos: number;
};

/**
 * Lista del catálogo con EDICIÓN INLINE (regla de oro): precio, oferta, stock,
 * categoría, activo y destacado sin entrar al producto. Borrar con confirm().
 */
export function ProductosTable({
  slug,
  productos,
  categorias,
}: {
  slug: string;
  productos: ProductoRow[];
  categorias: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo guardar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(p: ProductoRow) {
    if (!confirm(`¿Borrar "${p.nombre}" del catálogo? No se puede deshacer.`)) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/os/${slug}/bazar/productos/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo borrar el producto");
    } finally {
      setBusyId(null);
    }
  }

  if (productos.length === 0) {
    return (
      <EmptyState
        icon="🛍️"
        title="No hay productos acá"
        detail="Probá con otra búsqueda o cargá el primero."
      />
    );
  }

  const opcionesCategoria = categorias.map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-2">
      {error ? <ErrorState message={error} /> : null}
      <Table>
        <thead>
          <tr>
            <Th className="w-12"></Th>
            <Th>Producto</Th>
            <Th>Categoría</Th>
            <Th className="text-right">Precio</Th>
            <Th className="text-right">Oferta</Th>
            <Th className="text-right">Stock</Th>
            <Th className="text-center">Activo</Th>
            <Th className="text-center">⭐</Th>
            <Th className="text-right">Vendidos</Th>
            <Th className="w-10"></Th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => {
            const foto = primeraFoto(p.fotos);
            const endpoint = `/api/os/${slug}/bazar/productos/${p.id}`;
            return (
              <tr key={p.id} className={`hover:bg-muted/40 ${busyId === p.id ? "opacity-60" : ""}`}>
                <Td>
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt="" className="h-9 w-9 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm">
                      🐚
                    </div>
                  )}
                </Td>
                <Td>
                  <Link
                    href={`/os/${slug}/productos/${p.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {p.nombre}
                  </Link>
                  {p.sku ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">{p.sku}</span>
                  ) : null}
                </Td>
                <Td>
                  <InlineEdit
                    endpoint={endpoint}
                    field="categoria"
                    value={p.categoria}
                    options={opcionesCategoria}
                  />
                </Td>
                <Td className="text-right">
                  <InlineEdit
                    endpoint={endpoint}
                    field="precio"
                    value={p.precio}
                    type="number"
                    alignRight
                    display={(v) => (v == null ? "—" : fmtArs(Number(v)))}
                  />
                </Td>
                <Td className="text-right">
                  <InlineEdit
                    endpoint={endpoint}
                    field="precioOferta"
                    value={p.precioOferta}
                    type="number"
                    alignRight
                    placeholder="—"
                    display={(v) =>
                      v == null || v === "" ? (
                        <span className="text-muted-foreground/50">—</span>
                      ) : (
                        <span className="font-medium text-success">{fmtArs(Number(v))}</span>
                      )
                    }
                  />
                </Td>
                <Td className="text-right">
                  <InlineEdit
                    endpoint={endpoint}
                    field="stock"
                    value={p.stock}
                    type="number"
                    alignRight
                    display={(v) => {
                      const s = Number(v ?? 0);
                      if (s <= 0) return <Badge variant="destructive">sin stock</Badge>;
                      if (s <= 3) return <Badge variant="warning">{s}</Badge>;
                      return s;
                    }}
                  />
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => patch(p.id, { activo: !p.activo })}
                    title={p.activo ? "Está visible en la tienda — click para pausar" : "Pausado — click para activar"}
                    className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${p.activo ? "bg-success" : "bg-muted"}`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${p.activo ? "translate-x-5" : ""}`}
                    />
                  </button>
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => patch(p.id, { destacado: !p.destacado })}
                    title={p.destacado ? "Destacado — click para quitar" : "Click para destacar"}
                    className={`text-lg transition-opacity ${p.destacado ? "" : "opacity-25 hover:opacity-60"}`}
                  >
                    ⭐
                  </button>
                </Td>
                <Td className="text-right text-muted-foreground">{p.vendidos}</Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => borrar(p)}
                    title="Borrar producto"
                    className="text-muted-foreground/50 transition-colors hover:text-destructive"
                  >
                    🗑
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
