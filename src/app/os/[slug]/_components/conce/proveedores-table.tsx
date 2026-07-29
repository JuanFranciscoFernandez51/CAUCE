"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { CopiarBtn } from "./copiar-btn";
import { waLink } from "@/lib/conce-fin";

export type ProveedorRow = {
  id: string;
  nombre: string;
  rubro: string | null;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  activo: boolean;
  contactos: number;
  cuentas: number;
  precios: number;
};

/**
 * Lista de proveedores editable EN LA MISMA FILA (nombre, rubro, teléfono,
 * activo) y con el CUIT copiable de una. El ✏️ abre la ficha completa.
 */
export function ProveedoresTable({
  slug,
  proveedores,
}: {
  slug: string;
  proveedores: ProveedorRow[];
  }) {
  const router = useRouter();
  const [borrando, setBorrando] = useState<string | null>(null);

  if (proveedores.length === 0) {
    return (
      <EmptyState
        icon="🏭"
        title="Todavía no hay proveedores"
        detail="Cargá el primero con el botón de arriba: después le sumás contactos, cuentas bancarias y lista de precios."
      />
    );
  }

  async function borrar(id: string, nombre: string) {
    if (!confirm(`¿Borrar el proveedor "${nombre}"? Se van también sus cuentas y precios.`)) return;
    setBorrando(id);
    try {
      const res = await fetch(`/api/os/${slug}/conce/proveedores/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBorrando(null);
    }
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Proveedor</Th>
          <Th>Rubro</Th>
          <Th>CUIT</Th>
          <Th>Teléfono</Th>
          <Th>Ficha</Th>
          <Th>Activo</Th>
          <Th className="w-24"></Th>
        </tr>
      </thead>
      <tbody>
        {proveedores.map((p) => {
          const endpoint = `/api/os/${slug}/conce/proveedores/${p.id}`;
          return (
            <tr key={p.id} className={`hover:bg-muted/40 ${p.activo ? "" : "opacity-60"}`}>
              <Td className="font-medium">
                <InlineEdit endpoint={endpoint} field="nombre" value={p.nombre} />
                {p.ciudad ? (
                  <span className="block text-xs font-normal text-muted-foreground">{p.ciudad}</span>
                ) : null}
              </Td>
              <Td className="text-sm">
                <InlineEdit endpoint={endpoint} field="rubro" value={p.rubro} placeholder="+ rubro" />
              </Td>
              <Td className="text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono">{p.cuit || "—"}</span>
                  <CopiarBtn valor={p.cuit} etiqueta="CUIT" />
                </span>
              </Td>
              <Td className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <InlineEdit
                    endpoint={endpoint}
                    field="telefono"
                    value={p.telefono}
                    placeholder="+ teléfono"
                  />
                  {p.telefono ? (
                    <a
                      href={waLink(p.telefono, "Hola, ¿cómo va?")}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      className="hover:opacity-70"
                    >
                      💬
                    </a>
                  ) : null}
                </span>
              </Td>
              <Td className="text-xs text-muted-foreground">
                <Link href={`/os/${slug}/proveedores/${p.id}`} className="hover:text-primary">
                  👤 {p.contactos} · 🏦 {p.cuentas} · 🏷️ {p.precios}
                </Link>
              </Td>
              <Td>
                <InlineEdit
                  endpoint={endpoint}
                  field="activo"
                  value={p.activo ? "si" : "no"}
                  options={[
                    { value: "si", label: "Activo" },
                    { value: "no", label: "Inactivo" },
                  ]}
                  display={(v) => (
                    <Badge variant={v === "si" ? "success" : "default"}>
                      {v === "si" ? "Activo" : "Inactivo"}
                    </Badge>
                  )}
                />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/os/${slug}/proveedores/${p.id}`}
                    title="Abrir la ficha completa"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    ✏️
                  </Link>
                  <button
                    type="button"
                    onClick={() => borrar(p.id, p.nombre)}
                    disabled={borrando === p.id}
                    title="Borrar proveedor"
                    className="text-muted-foreground/60 hover:text-destructive disabled:opacity-40"
                  >
                    🗑️
                  </button>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
