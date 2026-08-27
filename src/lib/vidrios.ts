import type { Client, PresupuestoDoc } from "@prisma/client";

/**
 * Lado server del template VIDRIOS (Código Auto): venta y colocación de
 * parabrisas. Las órdenes de pedido REUSAN PresupuestoDoc:
 *   - estado          → estado del trabajo: "PENDIENTE" | "COLOCADO"
 *   - datos (Json)    → { tipo:"orden", vehiculo, senia, facturacion }
 *   - items (Json)    → [{ codigo?, detalle, cant, unitario }]
 * Sin migraciones: todo lo específico del rubro viaja en los Json.
 */

export function esVidrios(tenant: Client): boolean {
  return (tenant.settings as { template?: string } | null)?.template === "vidrios";
}

export type OrdenItem = { codigo?: string; detalle: string; cant: number; unitario: number };

export type OrdenFacturacion = "sin_facturar" | "a_facturar" | "facturada";

export type OrdenDatos = {
  tipo: "orden";
  vehiculo?: { marca?: string; modelo?: string; patente?: string };
  senia: number;
  facturacion: OrdenFacturacion;
};

/** Lee los datos de la orden con defaults seguros (datos viejos o vacíos no rompen). */
export function ordenDatos(p: Pick<PresupuestoDoc, "datos">): OrdenDatos {
  const d = (p.datos ?? {}) as Partial<OrdenDatos>;
  return {
    tipo: "orden",
    vehiculo: d.vehiculo ?? {},
    senia: typeof d.senia === "number" ? d.senia : 0,
    facturacion: d.facturacion === "a_facturar" || d.facturacion === "facturada" ? d.facturacion : "sin_facturar",
  };
}

export function ordenItems(p: Pick<PresupuestoDoc, "items">): OrdenItem[] {
  return Array.isArray(p.items) ? (p.items as OrdenItem[]) : [];
}

export function totalOrden(p: Pick<PresupuestoDoc, "items">): number {
  return ordenItems(p).reduce((a, i) => a + (Number(i.cant) || 0) * (Number(i.unitario) || 0), 0);
}

/** "VW Gol AB123CD" — el vehículo en una línea para listas y el boleto. */
export function vehiculoLinea(d: OrdenDatos): string {
  const v = d.vehiculo ?? {};
  return [v.marca, v.modelo, v.patente ? `· ${v.patente}` : ""].filter(Boolean).join(" ").trim();
}

export const FACTURACION_LABEL: Record<OrdenFacturacion, string> = {
  sin_facturar: "Sin facturar",
  a_facturar: "A facturar",
  facturada: "Facturada",
};
