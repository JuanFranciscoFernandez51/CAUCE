import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { proximoNumeroOperacion, vincularContacto } from "@/lib/conce-server";
import { DOCS_DEFAULT } from "@/lib/conce";

/** Alta de mandatos de venta y boletos/órdenes de compra. */

const docSchema = z.object({ item: z.string().trim().min(1).max(120), ok: z.boolean() });

export const permutaSchema = z.object({
  marca: z.string().trim().max(80).default(""),
  modelo: z.string().trim().max(120).default(""),
  anio: z.number().int().min(1950).max(2030).default(new Date().getFullYear()),
  km: z.number().int().min(0).default(0),
  valorTomado: z.number().min(0).default(0),
  dominio: z.string().trim().max(20).optional().default(""),
  vehiculoId: z.string().trim().max(60).nullable().optional(),
});

export const pagoSchema = z.object({
  metodo: z.string().trim().max(40).default("efectivo"),
  monto: z.number().min(0).default(0),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  fecha: z.string().trim().max(20).optional().default(""),
  detalle: z.string().trim().max(200).optional().default(""),
});

const createSchema = z.object({
  tipo: z.enum(["MANDATO", "BOLETO"]),
  fecha: z.string().trim().optional(),
  nombre: z.string().trim().min(1, "Poné el nombre").max(200),
  dni: z.string().trim().max(20).optional().default(""),
  domicilio: z.string().trim().max(200).optional().default(""),
  telefono: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  contactId: z.string().trim().max(60).nullable().optional(),
  vehiculoId: z.string().trim().max(60).optional(),
  vehiculoTexto: z.string().trim().max(300).optional().default(""),
  vehMarca: z.string().trim().max(80).optional().default(""),
  vehModelo: z.string().trim().max(120).optional().default(""),
  vehAnio: z.number().int().min(1950).max(2030).nullable().optional(),
  vehKm: z.number().int().min(0).nullable().optional(),
  permutas: z.array(permutaSchema).max(10).optional(),
  pagos: z.array(pagoSchema).max(30).optional(),
  dominio: z.string().trim().max(20).optional().default(""),
  chasis: z.string().trim().max(60).optional().default(""),
  motorNro: z.string().trim().max(60).optional().default(""),
  documentacion: z.array(docSchema).max(20).optional(),
  precio: z.number().min(0).nullable().optional(),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  comisionPct: z.number().min(0).max(100).nullable().optional(),
  sena: z.number().min(0).optional().default(0),
  formaPago: z.string().trim().max(80).optional().default(""),
  finCuotas: z.number().int().min(1).max(120).nullable().optional(),
  finValorCuota: z.number().min(0).nullable().optional(),
  finDiaVenc: z.number().int().min(1).max(28).nullable().optional(),
  condiciones: z.string().trim().max(4000).optional().default(""),
  observaciones: z.string().trim().max(4000).optional().default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Vehículo scopeado (si vino).
  let vehiculoId: string | null = null;
  if (d.vehiculoId) {
    const v = await db.conceVehiculo.findFirst({
      where: { id: d.vehiculoId, clientId: g.tenant.id },
      select: { id: true, dominio: true },
    });
    if (v) vehiculoId = v.id;
  }

  // Todo cliente entra al CRM único: si lo eligieron del buscador se usa ese y
  // se le completan los huecos (DNI/domicilio); si es nuevo, se crea.
  const contactId = await vincularContacto(db, g.tenant.id, {
    nombre: d.nombre,
    telefono: d.telefono,
    email: d.email,
    dni: d.dni,
    domicilio: d.domicilio,
    contactId: d.contactId,
  });

  const operacion = await db.conceOperacion.create({
    data: {
      clientId: g.tenant.id,
      tipo: d.tipo,
      numero: await proximoNumeroOperacion(db, g.tenant.id, d.tipo),
      contactId,
      fecha: d.fecha ? new Date(`${d.fecha}T12:00:00-03:00`) : new Date(),
      nombre: d.nombre,
      dni: d.dni || null,
      domicilio: d.domicilio || null,
      telefono: d.telefono || null,
      email: d.email || null,
      vehiculoId,
      vehiculoTexto: d.vehiculoTexto || null,
      vehMarca: d.vehMarca || null,
      vehModelo: d.vehModelo || null,
      vehAnio: d.vehAnio ?? null,
      vehKm: d.vehKm ?? null,
      permutas: (d.permutas ?? []).filter((p) => p.marca.trim()),
      pagos: (d.pagos ?? []).filter((p) => p.monto > 0),
      dominio: d.dominio || null,
      chasis: d.chasis || null,
      motorNro: d.motorNro || null,
      documentacion: d.documentacion ?? DOCS_DEFAULT,
      precio: d.precio && d.precio > 0 ? d.precio : null,
      moneda: d.moneda,
      comisionPct: d.comisionPct ?? null,
      sena: d.sena,
      formaPago: d.formaPago || null,
      finCuotas: d.finCuotas ?? null,
      finValorCuota: d.finValorCuota ?? null,
      finDiaVenc: d.finDiaVenc ?? null,
      condiciones: d.condiciones || null,
      observaciones: d.observaciones || null,
    },
  });

  // Un mandato sobre un vehículo del stock lo deja "reservado"? No: el mandato
  // es consignación (entra a la venta). Un BOLETO con seña sí lo reserva.
  if (d.tipo === "BOLETO" && vehiculoId) {
    await db.conceVehiculo.updateMany({
      where: { id: vehiculoId, clientId: g.tenant.id, estado: "disponible" },
      data: { estado: "reservado" },
    });
  }

  return NextResponse.json({ ok: true, operacion }, { status: 201 });
}
