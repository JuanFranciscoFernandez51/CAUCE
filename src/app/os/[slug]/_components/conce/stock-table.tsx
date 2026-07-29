"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState, ErrorState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { primeraFotoVehiculo, VEHICULO_ESTADO_LABEL } from "@/lib/conce";

export type VehiculoRow = {
  id: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  tipo: string;
  estado: string;
  publicado: boolean;
  destacado: boolean;
  oferta: boolean;
  visitas: number;
  dominio: string | null;
  fotos: unknown;
  origenTipo: string | null;
  origenTexto: string | null;
  origenHref: string | null;
};

/**
 * Lista del stock con EDICIÓN INLINE (regla de oro): precio, moneda, estado
 * (disponible/reservado/vendido), km, destacado y oferta sin entrar al
 * vehículo. Botón 📣 publica en IG/ML. Borrar con confirm().
 */
export function StockTable({ slug, vehiculos }: { slug: string; vehiculos: VehiculoRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/vehiculos/${id}`, {
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

  async function borrar(v: VehiculoRow) {
    if (!confirm(`¿Borrar el ${v.marca} ${v.modelo} ${v.anio} del stock? No se puede deshacer.`))
      return;
    setBusyId(v.id);
    try {
      const res = await fetch(`/api/os/${slug}/conce/vehiculos/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo borrar el vehículo");
    } finally {
      setBusyId(null);
    }
  }

  if (vehiculos.length === 0) {
    return (
      <EmptyState
        icon="🚗"
        title="No hay vehículos acá"
        detail="Probá con otra búsqueda o cargá el primero."
      />
    );
  }

  const estadoOpciones = Object.entries(VEHICULO_ESTADO_LABEL).map(([value, label]) => ({
    value,
    label,
  }));
  const monedaOpciones = [
    { value: "ARS", label: "$ ARS" },
    { value: "USD", label: "US$" },
  ];

  return (
    <div className="space-y-2">
      {error ? <ErrorState message={error} /> : null}
      <Table>
        <thead>
          <tr>
            <Th className="w-14"></Th>
            <Th>Vehículo</Th>
            <Th className="text-right">Precio</Th>
            <Th>Moneda</Th>
            <Th className="text-right">Km</Th>
            <Th>Estado</Th>
            <Th className="text-center">🌐</Th>
            <Th className="text-center">⭐</Th>
            <Th className="text-center">🔥</Th>
            <Th className="text-right">Vistas</Th>
            <Th className="w-20"></Th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map((v) => {
            const foto = primeraFotoVehiculo(v.fotos);
            const endpoint = `/api/os/${slug}/conce/vehiculos/${v.id}`;
            return (
              <tr key={v.id} className={`hover:bg-muted/40 ${busyId === v.id ? "opacity-60" : ""}`}>
                <Td>
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt="" className="h-9 w-12 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-9 w-12 items-center justify-center rounded-md bg-muted text-sm">
                      🚗
                    </div>
                  )}
                </Td>
                <Td>
                  <Link href={`/os/${slug}/stock/${v.id}`} className="font-medium hover:text-primary">
                    {v.marca} {v.modelo}
                    {v.version ? <span className="text-muted-foreground"> {v.version}</span> : null}
                  </Link>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {v.anio}
                    {v.condicion === "0km" ? " · 0KM" : ""}
                    {v.dominio ? ` · ${v.dominio}` : ""}
                  </span>
                  {v.origenTexto ? (
                    <span className="block text-xs text-primary" title={v.origenTexto}>
                      {v.origenTipo === "PERMUTA" ? "↔" : "📝"} {v.origenTexto}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right">
                  <InlineEdit
                    endpoint={endpoint}
                    field="precio"
                    value={v.precio}
                    type="number"
                    alignRight
                    placeholder="Consultar"
                    display={(val) =>
                      val == null || val === "" ? (
                        <span className="font-medium text-warning">Consultar</span>
                      ) : (
                        `${v.moneda === "USD" ? "US$" : "$"} ${Number(val).toLocaleString("es-AR")}`
                      )
                    }
                  />
                </Td>
                <Td>
                  <InlineEdit endpoint={endpoint} field="moneda" value={v.moneda} options={monedaOpciones} />
                </Td>
                <Td className="text-right">
                  <InlineEdit
                    endpoint={endpoint}
                    field="km"
                    value={v.km}
                    type="number"
                    alignRight
                    display={(val) => Number(val ?? 0).toLocaleString("es-AR")}
                  />
                </Td>
                <Td>
                  <InlineEdit
                    endpoint={endpoint}
                    field="estado"
                    value={v.estado}
                    options={estadoOpciones}
                    display={(val) => (
                      <Badge
                        variant={
                          val === "disponible" ? "success" : val === "reservado" ? "warning" : "destructive"
                        }
                      >
                        {VEHICULO_ESTADO_LABEL[String(val)] ?? String(val)}
                      </Badge>
                    )}
                  />
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => patch(v.id, { publicado: !v.publicado })}
                    title={
                      v.publicado
                        ? "Se ve en la web — click para bajarlo"
                        : "NO se ve en la web — click para publicarlo"
                    }
                    className={`text-lg transition-opacity ${v.publicado ? "" : "opacity-25 hover:opacity-60"}`}
                  >
                    🌐
                  </button>
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => patch(v.id, { destacado: !v.destacado })}
                    title={v.destacado ? "Destacado en la home — click para quitar" : "Click para destacar en la home"}
                    className={`text-lg transition-opacity ${v.destacado ? "" : "opacity-25 hover:opacity-60"}`}
                  >
                    ⭐
                  </button>
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => patch(v.id, { oferta: !v.oferta })}
                    title={v.oferta ? "En oferta — click para quitar" : "Click para marcar como oferta"}
                    className={`text-lg transition-opacity ${v.oferta ? "" : "opacity-25 hover:opacity-60"}`}
                  >
                    🔥
                  </button>
                </Td>
                <Td className="text-right text-muted-foreground">{v.visitas}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/os/${slug}/publicar?vehiculo=${v.id}`}
                      title="Publicar en Instagram / Mercado Libre"
                      className="text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      📣
                    </Link>
                    <button
                      type="button"
                      onClick={() => borrar(v)}
                      title="Borrar vehículo"
                      className="text-muted-foreground/50 transition-colors hover:text-destructive"
                    >
                      🗑
                    </button>
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
