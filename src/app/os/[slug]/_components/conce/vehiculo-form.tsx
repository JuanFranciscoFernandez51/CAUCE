"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Select, Textarea } from "@/components/ui";
import { CONCE_TIPOS } from "@/lib/conce";

export type VehiculoFormData = {
  id?: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  tipo: string;
  transmision: string;
  combustible: string;
  color: string;
  motor: string;
  dominio: string;
  descripcion: string;
  destacado: boolean;
  oferta: boolean;
  estado: string;
  fotos: string[];
};

/**
 * Form de vehículo: datos completos + multi-upload de fotos a Cloudinary
 * (uploadToTenant, scope ['vehiculos', id]) con reordenar por flechas —
 * el orden de las fotos ES el orden del carrusel de la web.
 * En el alta, primero se guarda el vehículo y después se cargan las fotos.
 */
export function VehiculoForm({ slug, inicial }: { slug: string; inicial: VehiculoFormData }) {
  const router = useRouter();
  const esNuevo = !inicial.id;
  const [form, setForm] = useState(inicial);
  const [fotos, setFotos] = useState<string[]>(inicial.fotos);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.marca.trim()) return setError("Poné la marca");
    if (!form.modelo.trim()) return setError("Poné el modelo");
    setGuardando(true);
    try {
      const body = {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        version: form.version.trim(),
        anio: Math.round(form.anio),
        km: Math.max(0, Math.round(form.km)),
        precio: form.precio != null && form.precio > 0 ? form.precio : null,
        moneda: form.moneda,
        condicion: form.condicion,
        tipo: form.tipo,
        transmision: form.transmision.trim(),
        combustible: form.combustible.trim(),
        color: form.color.trim(),
        motor: form.motor.trim(),
        dominio: form.dominio.trim(),
        descripcion: form.descripcion.trim(),
        destacado: form.destacado,
        oferta: form.oferta,
        estado: form.estado,
      };
      const res = await fetch(
        esNuevo ? `/api/os/${slug}/conce/vehiculos` : `/api/os/${slug}/conce/vehiculos/${inicial.id}`,
        {
          method: esNuevo ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      if (esNuevo) {
        // Al vehículo nuevo lo mandamos a su edición para cargarle las fotos.
        router.push(`/os/${slug}/stock/${data.vehiculo.id}`);
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
      for (const f of Array.from(files).slice(0, 12)) fd.append("files", f);
      const res = await fetch(`/api/os/${slug}/conce/vehiculos/${inicial.id}/fotos`, {
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
      await fetch(`/api/os/${slug}/conce/vehiculos/${inicial.id}`, {
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
    if (!confirm("¿Sacar esta foto del vehículo?")) return;
    void guardarFotos(fotos.filter((_, i) => i !== idx));
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Marca *">
            <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Toyota" />
          </Field>
          <Field label="Modelo *">
            <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Hilux" />
          </Field>
          <Field label="Versión">
            <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="Ej: SRX 4x4 AT" />
          </Field>
          <Field label="Año *">
            <Input type="number" min={1950} max={2030} value={form.anio || ""} onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })} />
          </Field>
          <Field label="Kilómetros">
            <Input type="number" min={0} value={form.km} onChange={(e) => setForm({ ...form, km: Number(e.target.value) })} />
          </Field>
          <Field label="Condición">
            <Select value={form.condicion} onChange={(e) => setForm({ ...form, condicion: e.target.value })}>
              <option value="usado">Usado</option>
              <option value="0km">0KM</option>
            </Select>
          </Field>
          <Field label="Precio" help="Vacío o 0 = muestra 'Consultar precio' en la web.">
            <Input
              type="number"
              min={0}
              value={form.precio ?? ""}
              onChange={(e) => setForm({ ...form, precio: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="Consultar precio"
            />
          </Field>
          <Field label="Moneda">
            <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              <option value="ARS">Pesos ($)</option>
              <option value="USD">Dólares (US$)</option>
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {CONCE_TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Transmisión">
            <Select value={form.transmision} onChange={(e) => setForm({ ...form, transmision: e.target.value })}>
              <option value="">—</option>
              <option value="Manual">Manual</option>
              <option value="Automática">Automática</option>
            </Select>
          </Field>
          <Field label="Combustible">
            <Select value={form.combustible} onChange={(e) => setForm({ ...form, combustible: e.target.value })}>
              <option value="">—</option>
              <option value="Nafta">Nafta</option>
              <option value="Diésel">Diésel</option>
              <option value="GNC">GNC</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
            </Select>
          </Field>
          <Field label="Color">
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ej: Gris plata" />
          </Field>
          <Field label="Motor">
            <Input value={form.motor} onChange={(e) => setForm({ ...form, motor: e.target.value })} placeholder="Ej: 2.8 TDI" />
          </Field>
          <Field label="Dominio (interno)" help="No se muestra en la web.">
            <Input value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value.toUpperCase() })} placeholder="AB123CD" />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </Select>
          </Field>
        </div>
        <Field label="Descripción">
          <Textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={5}
            placeholder="Equipamiento, services, detalles…"
          />
        </Field>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
            ⭐ Destacado en la home
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.oferta} onChange={(e) => setForm({ ...form, oferta: e.target.checked })} />
            🔥 En oferta
          </label>
        </div>
      </Card>

      {/* Fotos (solo con el vehículo ya creado) */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Fotos del carrusel</h2>
            <p className="text-xs text-muted-foreground">
              El orden acá es el orden en la web. Usá las flechas para reordenar. La primera es la portada.
            </p>
          </div>
          {inicial.id ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={subirFotos} />
              <Button type="button" variant="secondary" disabled={subiendo} onClick={() => fileRef.current?.click()}>
                {subiendo ? "Subiendo…" : "📷 Subir fotos"}
              </Button>
            </>
          ) : null}
        </div>

        {!inicial.id ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Guardá el vehículo y en el paso siguiente le cargás las fotos.
          </p>
        ) : fotos.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Sin fotos todavía — un auto con buenas fotos se consulta el doble. 😉
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {fotos.map((f, i) => (
              <div key={`${f}-${i}`} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full rounded-lg border object-cover" />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    PORTADA
                  </span>
                ) : null}
                <div className="absolute bottom-1 left-1 right-1 flex justify-between rounded bg-black/50 px-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="px-1 text-white disabled:opacity-30" title="Mover a la izquierda">
                    ←
                  </button>
                  <button type="button" onClick={() => quitarFoto(i)} className="px-1 text-white" title="Quitar foto">
                    🗑
                  </button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} className="px-1 text-white disabled:opacity-30" title="Mover a la derecha">
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
          {guardando ? "Guardando…" : esNuevo ? "Crear vehículo" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/os/${slug}/stock`)}>
          Volver al stock
        </Button>
      </div>
    </form>
  );
}
