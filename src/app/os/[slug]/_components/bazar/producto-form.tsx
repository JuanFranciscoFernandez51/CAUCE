"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Select, Textarea } from "@/components/ui";

export type ProductoFormData = {
  id?: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioOferta: number | null;
  stock: number;
  descripcion: string;
  sku: string;
  destacado: boolean;
  activo: boolean;
  fotos: string[];
};

/**
 * Form de producto del bazar: datos + multi-upload de fotos a Cloudinary
 * (uploadToTenant, scope ['productos', id]) con reordenar por flechas —
 * el orden de las fotos ES el orden del carrusel de la web.
 * En el alta, primero se guarda el producto y después se cargan las fotos.
 */
export function ProductoForm({
  slug,
  categorias,
  inicial,
}: {
  slug: string;
  categorias: string[];
  inicial: ProductoFormData;
}) {
  const router = useRouter();
  const esNuevo = !inicial.id;
  const [form, setForm] = useState(inicial);
  const [fotos, setFotos] = useState<string[]>(inicial.fotos);
  const [otraCategoria, setOtraCategoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("Poné el nombre del producto");
    if (!form.categoria.trim()) return setError("Elegí o escribí la categoría");
    setGuardando(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        precio: Math.max(0, Math.round(form.precio)),
        precioOferta:
          form.precioOferta != null && form.precioOferta > 0
            ? Math.round(form.precioOferta)
            : null,
        stock: Math.max(0, Math.round(form.stock)),
        descripcion: form.descripcion.trim(),
        sku: form.sku.trim(),
        destacado: form.destacado,
        activo: form.activo,
      };
      const res = await fetch(
        esNuevo
          ? `/api/os/${slug}/bazar/productos`
          : `/api/os/${slug}/bazar/productos/${inicial.id}`,
        {
          method: esNuevo ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      if (esNuevo) {
        // Al producto nuevo lo mandamos a su edición para cargarle las fotos.
        router.push(`/os/${slug}/productos/${data.producto.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  async function subirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0 || !inicial.id) return;
    setSubiendo(true);
    setError("");
    try {
      const fd = new FormData();
      for (const f of Array.from(files).slice(0, 8)) fd.append("files", f);
      const res = await fetch(`/api/os/${slug}/bazar/productos/${inicial.id}/fotos`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudieron subir las fotos");
      setFotos(data.fotos as string[]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo las fotos");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarFotos(nuevas: string[]) {
    setFotos(nuevas);
    try {
      await fetch(`/api/os/${slug}/bazar/productos/${inicial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotos: nuevas }),
      });
      router.refresh();
    } catch {
      setError("No se pudo guardar el orden de las fotos");
    }
  }

  function mover(idx: number, dir: -1 | 1) {
    const destino = idx + dir;
    if (destino < 0 || destino >= fotos.length) return;
    const nuevas = [...fotos];
    [nuevas[idx], nuevas[destino]] = [nuevas[destino], nuevas[idx]];
    void guardarFotos(nuevas);
  }

  function quitarFoto(idx: number) {
    if (!confirm("¿Sacar esta foto del producto?")) return;
    void guardarFotos(fotos.filter((_, i) => i !== idx));
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Set de 3 bowls Terracota"
            />
          </Field>
          <Field label="Categoría *">
            {otraCategoria || categorias.length === 0 ? (
              <Input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Nueva categoría…"
              />
            ) : (
              <div className="flex gap-2">
                <Select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {!form.categoria ? <option value="">Elegí…</option> : null}
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOtraCategoria(true)}>
                  + Nueva
                </Button>
              </div>
            )}
          </Field>
          <Field label="Precio (ARS) *">
            <Input
              type="number"
              min={0}
              value={form.precio || ""}
              onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
            />
          </Field>
          <Field label="Precio de oferta" help="Si lo cargás, es el precio vigente y el otro se muestra tachado.">
            <Input
              type="number"
              min={0}
              value={form.precioOferta ?? ""}
              onChange={(e) =>
                setForm({ ...form, precioOferta: e.target.value === "" ? null : Number(e.target.value) })
              }
              placeholder="Sin oferta"
            />
          </Field>
          <Field label="Stock">
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            />
          </Field>
          <Field label="SKU / código">
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="Ej: LE-0001"
            />
          </Field>
        </div>
        <Field label="Descripción">
          <Textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={4}
            placeholder="Materiales, medidas, qué lo hace especial…"
          />
        </Field>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Visible en la tienda
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
            />
            ⭐ Destacado
          </label>
        </div>
      </Card>

      {/* Fotos (solo con el producto ya creado) */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Fotos del carrusel</h2>
            <p className="text-xs text-muted-foreground">
              El orden acá es el orden en la web. Usá las flechas para reordenar.
            </p>
          </div>
          {inicial.id ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={subirFotos} />
              <Button
                type="button"
                variant="secondary"
                disabled={subiendo}
                onClick={() => fileRef.current?.click()}
              >
                {subiendo ? "Subiendo…" : "📷 Subir fotos"}
              </Button>
            </>
          ) : null}
        </div>

        {!inicial.id ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Guardá el producto y en el paso siguiente le cargás las fotos.
          </p>
        ) : fotos.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Sin fotos todavía — un producto con fotos vende el doble. 😉
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {fotos.map((f, i) => (
              <div key={`${f}-${i}`} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f}
                  alt={`Foto ${i + 1}`}
                  className="aspect-square w-full rounded-lg border object-cover"
                />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    PORTADA
                  </span>
                ) : null}
                <div className="absolute bottom-1 left-1 right-1 flex justify-between rounded bg-black/50 px-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    className="px-1 text-white disabled:opacity-30"
                    title="Mover a la izquierda"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className="px-1 text-white"
                    title="Quitar foto"
                  >
                    🗑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === fotos.length - 1}
                    className="px-1 text-white disabled:opacity-30"
                    title="Mover a la derecha"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : esNuevo ? "Crear producto" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/os/${slug}/productos`)}>
          Volver al catálogo
        </Button>
      </div>
    </form>
  );
}
