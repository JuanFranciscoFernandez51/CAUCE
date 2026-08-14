import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";
import { pagoSchema, permutaSchema } from "../route";
import {
  anularOperacion,
  concretarOperacion,
  firmarOperacion,
  vincularContacto,
} from "@/lib/conce-server";

/**
 * Edición y cambio de estado de un mandato/boleto. Cada estado dispara sus
 * automatizaciones (idempotentes):
 *  - FIRMADO    → el mandato mete el vehículo en el stock SIN publicar.
 *  - CONCRETADA → vehículo vendido + ingreso en Finanzas + permutas al stock.
 *  - CANCELADA  → lo que entró por la operación sale de circulación.
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
    contactId: z.string().trim().max(60).nullable(),
    vehiculoTexto: z.string().trim().max(300).nullable(),
    vehiculoId: z.string().trim().max(60).nullable(),
    vehMarca: z.string().trim().max(80).nullable(),
    vehModelo: z.string().trim().max(120).nullable(),
    vehAnio: z.number().int().min(1950).max(2030).nullable(),
    vehKm: z.number().int().min(0).nullable(),
    permutas: z.array(permutaSchema).max(10),
    pagos: z.array(pagoSchema).max(30),
    dominio: z.string().trim().max(20).nullable(),
    chasis: z.string().trim().max(60).nullable(),
    motorNro: z.string().trim().max(60).nullable(),
    documentacion: z.array(docSchema).max(20),
    precio: z.number().min(0).nullable(),
    moneda: z.enum(["ARS", "USD"]),
    comisionPct: z.number().min(0).max(100).nullable(),
    sena: z.number().min(0),
    formaPago: z.string().trim().max(80).nullable(),
    finCuotas: z.number().int().min(1).max(120).nullable(),
    finValorCuota: z.number().min(0).nullable(),
    finDiaVenc: z.number().int().min(1).max(28).nullable(),
    condiciones: z.string().trim().max(4000).nullable(),
    observaciones: z.string().trim().max(4000).nullable(),
    estado: z.enum(["VIGENTE", "FIRMADO", "CONCRETADA", "CANCELADA"]),
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
    select: { id: true, tipo: true, estado: true, vehiculoId: true, nombre: true },
  });
  if (!op) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Campos "planos" (todo menos el estado, que dispara automatizaciones).
  const { estado: nuevoEstado, fecha, vehiculoId, permutas, pagos, contactId, ...resto } = d;

  // El vehículo del stock tiene que ser de ESTE tenant.
  let vehiculoIdFinal: string | null | undefined;
  if (vehiculoId !== undefined) {
    vehiculoIdFinal = null;
    if (vehiculoId) {
      const v = await db.conceVehiculo.findFirst({
        where: { id: vehiculoId, clientId: g.tenant.id },
        select: { id: true },
      });
      vehiculoIdFinal = v?.id ?? null;
    }
  }

  const datosPlanos = {
    ...resto,
    ...(fecha ? { fecha: new Date(`${fecha}T12:00:00-03:00`) } : {}),
    ...(vehiculoIdFinal !== undefined ? { vehiculoId: vehiculoIdFinal } : {}),
    ...(permutas !== undefined
      ? { permutas: permutas.filter((p) => p.marca.trim()) as unknown as Prisma.InputJsonValue }
      : {}),
    ...(pagos !== undefined
      ? { pagos: pagos.filter((p) => p.monto > 0) as unknown as Prisma.InputJsonValue }
      : {}),
  };

  if (Object.keys(datosPlanos).length > 0) {
    await db.conceOperacion.update({ where: { id }, data: datosPlanos });
  }

  // Si tocaron los datos de la persona (o eligieron otro cliente del buscador),
  // mantenemos el CRM al día: completa los huecos de su ficha (DNI/domicilio)
  // sin pisar lo que ya esté cargado.
  if (
    contactId !== undefined ||
    resto.nombre ||
    resto.telefono !== undefined ||
    resto.email !== undefined ||
    resto.dni !== undefined ||
    resto.domicilio !== undefined
  ) {
    const actual = await db.conceOperacion.findFirst({
      where: { id, clientId: g.tenant.id },
      select: {
        nombre: true,
        telefono: true,
        email: true,
        dni: true,
        domicilio: true,
        contactId: true,
      },
    });
    if (actual) {
      const vinculado = await vincularContacto(db, g.tenant.id, {
        ...actual,
        contactId: contactId ?? actual.contactId,
      });
      if (vinculado && vinculado !== actual.contactId) {
        await db.conceOperacion.update({ where: { id }, data: { contactId: vinculado } });
      }
    }
  }

  // Firmar: el mandato mete el vehículo al stock (sin publicar).
  if (nuevoEstado === "FIRMADO" && op.estado !== "FIRMADO" && op.estado !== "CONCRETADA") {
    await firmarOperacion({ clientId: g.tenant.id, operacionId: id });
  } else if (nuevoEstado === "CONCRETADA" && op.estado !== "CONCRETADA") {
    await concretarOperacion({ clientId: g.tenant.id, operacionId: id });
  } else if (nuevoEstado === "CANCELADA" && op.estado !== "CANCELADA") {
    await anularOperacion({ clientId: g.tenant.id, operacionId: id });
  } else if (nuevoEstado && nuevoEstado !== op.estado) {
    await db.conceOperacion.update({ where: { id }, data: { estado: nuevoEstado } });
  }

  const operacion = await db.conceOperacion.findFirst({ where: { id, clientId: g.tenant.id } });
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
