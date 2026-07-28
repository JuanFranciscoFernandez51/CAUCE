import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";
import { concretarOperacion } from "@/lib/conce-server";

/**
 * Edición y cambio de estado de un mandato/boleto.
 * estado=CONCRETADA dispara los efectos (Finanzas + vehículo vendido) una
 * sola vez, vía concretarOperacion (idempotente).
 */

const docSchema = z.object({ item: z.string().trim().min(1).max(120), ok: z.boolean() });

const patchSchema = z
  .object({
    fecha: z.string().trim(),
    nombre: z.string().trim().min(1).max(200),
    dni: z.string().trim().max(20).nullable(),
    domicilio: z.string().trim().max(200).nullable(),
    telefono: z.string().trim().max(40).nullable(),
    email: z.string().trim().max(120).nullable(),
    vehiculoTexto: z.string().trim().max(300).nullable(),
    dominio: z.string().trim().max(20).nullable(),
    chasis: z.string().trim().max(60).nullable(),
    motorNro: z.string().trim().max(60).nullable(),
    documentacion: z.array(docSchema).max(20),
    precio: z.number().min(0).nullable(),
    moneda: z.enum(["ARS", "USD"]),
    comisionPct: z.number().min(0).max(100).nullable(),
    sena: z.number().min(0),
    formaPago: z.string().trim().max(80).nullable(),
    condiciones: z.string().trim().max(4000).nullable(),
    observaciones: z.string().trim().max(4000).nullable(),
    estado: z.enum(["VIGENTE", "CONCRETADA", "CANCELADA"]),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const op = await db.conceOperacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true, estado: true, vehiculoId: true },
  });
  if (!op) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Concretar: efectos completos (una sola vez).
  if (d.estado === "CONCRETADA" && op.estado !== "CONCRETADA") {
    const { estado: _estado, fecha: _fecha, ...resto } = d;
    if (Object.keys(resto).length > 0) {
      await db.conceOperacion.update({
        where: { id },
        data: {
          ...resto,
          ...(d.fecha ? { fecha: new Date(`${d.fecha}T12:00:00-03:00`) } : {}),
        },
      });
    }
    await concretarOperacion({ clientId: g.tenant.id, operacionId: id });
    const actualizada = await db.conceOperacion.findFirst({ where: { id } });
    return NextResponse.json({ ok: true, operacion: actualizada });
  }

  // Cancelar un boleto libera el vehículo reservado.
  if (d.estado === "CANCELADA" && op.estado !== "CANCELADA" && op.vehiculoId) {
    await db.conceVehiculo.updateMany({
      where: { id: op.vehiculoId, clientId: g.tenant.id, estado: "reservado" },
      data: { estado: "disponible" },
    });
  }

  const operacion = await db.conceOperacion.update({
    where: { id },
    data: {
      ...d,
      ...(d.fecha ? { fecha: new Date(`${d.fecha}T12:00:00-03:00`) } : {}),
    },
  });
  return NextResponse.json({ ok: true, operacion });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const op = await db.conceOperacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!op) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.conceOperacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
