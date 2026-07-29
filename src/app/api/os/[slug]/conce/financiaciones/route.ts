import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { crearFinanciacion } from "@/lib/conce-fin-server";
import { vincularContacto } from "@/lib/conce-server";
import { registrarActividad } from "@/lib/actividad";
import { numeroFinanciacion } from "@/lib/conce-fin";

/** Alta manual de una financiación propia: crea la financiación Y sus cuotas. */
const createSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  telefono: z.string().trim().max(40).optional(),
  email: z.string().trim().max(120).optional(),
  contactId: z.string().trim().max(60).optional(),
  descripcion: z.string().trim().max(200).optional(),
  montoTotal: z.number().min(0),
  entrega: z.number().min(0).default(0),
  cantidadCuotas: z.number().int().min(1).max(120),
  valorCuota: z.number().min(0).nullable().optional(),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  fechaInicio: z.string().trim().optional(),
  diaVencimiento: z.number().int().min(1).max(28).default(10),
  observaciones: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
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

  // Regla de oro: todo cliente entra al CRM único.
  let contactId = d.contactId || null;
  if (contactId) {
    const c = await db.contact.findFirst({
      where: { id: contactId, clientId: g.tenant.id },
      select: { id: true },
    });
    contactId = c?.id ?? null;
  }
  if (!contactId) {
    contactId = await vincularContacto(db, g.tenant.id, {
      nombre: d.nombre,
      telefono: d.telefono,
      email: d.email,
    });
  }

  const fin = await db.$transaction((tx) =>
    crearFinanciacion(tx, g.tenant.id, {
      contactId,
      descripcion: d.descripcion,
      origen: "MANUAL",
      montoTotal: d.montoTotal,
      entrega: d.entrega,
      cantidadCuotas: d.cantidadCuotas,
      valorCuota: d.valorCuota,
      moneda: d.moneda,
      fechaInicio: d.fechaInicio ? new Date(`${d.fechaInicio}T12:00:00-03:00`) : new Date(),
      diaVencimiento: d.diaVencimiento,
      observaciones: d.observaciones,
    })
  );

  await registrarActividad(
    g.tenant.id,
    "financiacion_creada",
    `${numeroFinanciacion(fin.numero)} — ${d.nombre}`
  );
  return NextResponse.json({ ok: true, financiacion: fin }, { status: 201 });
}
