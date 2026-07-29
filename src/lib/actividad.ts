import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** Etiquetas en criollo de cada acción registrada. */
export const ACCION_LABELS: Record<string, string> = {
  caja_abierta: "Abrió la caja",
  caja_cerrada: "Cerró la caja",
  venta_creada: "Creó una venta",
  venta_entregada: "Entregó una venta",
  venta_cancelada: "Canceló una venta",
  ot_creada: "Ingresó un trabajo al taller",
  ot_estado: "Movió una orden de trabajo",
  proceso_toggle: "Pausó/reactivó un proceso",
  costo_agregado: "Agregó un costo fijo",
  costo_borrado: "Borró un costo fijo",
  usuario_creado: "Creó un usuario",
  usuario_borrado: "Quitó un acceso",
  marca_editada: "Cambió la marca del sistema",
  presupuesto_creado: "Creó un presupuesto",
  presupuesto_aceptado: "Presupuesto aceptado (pasó a OT)",
  contactos_importados: "Importó contactos al CRM",
  operacion_firmada: "Firmó un mandato/boleto",
  operacion_concretada: "Concretó un mandato/boleto",
  operacion_cancelada: "Anuló un mandato/boleto",
  financiacion_creada: "Armó una financiación",
  cuota_pagada: "Cobró una cuota",
  cuota_aviso: "Avisó un vencimiento por WhatsApp",
  proveedor_creado: "Cargó un proveedor",
};

/**
 * Registra una acción sensible. Fire-and-forget: NUNCA rompe la operación
 * principal (si falla el log, la acción igual sale).
 */
export async function registrarActividad(
  clientId: string,
  accion: string,
  detalle?: string
): Promise<void> {
  try {
    const session = await auth();
    await db.actividad.create({
      data: {
        clientId,
        usuario: session?.user?.name ?? null,
        accion,
        detalle: detalle || null,
      },
    });
  } catch {
    // silencio: el log jamás bloquea la operación
  }
}
